# Guide d'intégration Yabetoo Pay

Ce document explique comment intégrer **Yabetoo Pay** dans un autre projet en s'inspirant de l'implémentation de ce dépôt.

L'objectif n'est pas de reproduire l'UI, mais de reprendre le **contrat technique** qui fonctionne ici:
- un module client serveur unique pour parler à Yabetoo,
- une route API pour créer et confirmer les paiements,
- un webhook pour valider le résultat côté serveur,
- une réconciliation planifiée pour rattraper les paiements sans webhook,
- des fonctions SQL atomiques pour mettre à jour les soldes et les statuts.

---

## 1. Vue d'ensemble du flux

### Encaissement
1. Le client appelle une route serveur locale avec le montant et les infos utilisateur.
2. Le serveur crée un `payment intent` chez Yabetoo.
3. Le serveur enregistre une transaction locale en `pending`.
4. Le serveur confirme l'intention pour déclencher le push USSD / Mobile Money.
5. Yabetoo envoie un webhook.
6. Le webhook valide la signature, puis appelle une RPC SQL pour finaliser la transaction.
7. Un cron de secours interroge Yabetoo si le webhook n'est jamais arrivé.

### Décaissement
1. Le client demande un retrait.
2. Le serveur réserve le montant localement dans la base.
3. Le serveur appelle l'API `disbursement` de Yabetoo.
4. Si l'appel réussit, la référence locale est remplacée par la référence provider.
5. Si l'appel échoue, la réserve est annulée et les fonds sont remis sur le solde local.
6. Le webhook de décaissement confirme ou invalide la sortie de fonds.

---

## 2. Variables d'environnement

Prévoir au minimum:

```env
YABETOO_SECRET_KEY=
YABETOO_WEBHOOK_SECRET=
CRON_SECRET=
NEXT_PUBLIC_YABETOO_BASE_URL=https://pay.api.yabetoopay.com
```

Règles observées ici:
- si `YABETOO_SECRET_KEY` contient `test`, le code bascule sur le sandbox `https://pay.sandbox.yabetoopay.com`;
- sinon il utilise `https://pay.api.yabetoopay.com`;
- le webhook utilise `YABETOO_WEBHOOK_SECRET` si présent, sinon retombe sur `YABETOO_SECRET_KEY`;
- le cron est protégé par `Authorization: Bearer <CRON_SECRET>`.

---

## 3. Module d'accès à Yabetoo

Créer un fichier central, comme `lib/yabetoo.js`, qui encapsule tout l'accès HTTP.

### Responsabilités du module
- construire la bonne base URL sandbox/production;
- envoyer le header `Authorization: Bearer ...`;
- parser la réponse JSON de manière robuste;
- remonter des erreurs lisibles quand Yabetoo répond avec une erreur;
- normaliser les numéros de téléphone et l'opérateur Mobile Money.

### Fonctions à reproduire

#### `formatMsisdn(phone)`
Dans ce projet, les numéros Congo sont normalisés en:
- `+2420XXXXXXXX`

La logique:
- retirer tous les caractères non numériques;
- si le numéro commence déjà par `242`, retirer ce préfixe;
- forcer un `0` au début de la partie locale;
- préfixer par `+242`.

#### `detectOperator(msisdn)`
Déduire l'opérateur à partir du préfixe local:
- `06` → `mtn`
- `04` ou `05` → `airtel`
- sinon `null`

#### `createPaymentIntent({ amount, description, metadata })`
Appeler:

```http
POST /v1/payment-intents
```

Body:
```json
{
  "amount": 2000,
  "currency": "xaf",
  "description": "Activation compte",
  "metadata": {}
}
```

#### `confirmPaymentIntent({ intentId, clientSecret, firstName, lastName, msisdn, operatorName })`
Appeler:

```http
POST /v1/payment-intents/:intentId/confirm
```

Body observé ici:
```json
{
  "client_secret": "....",
  "first_name": "Client",
  "last_name": "Level Cash",
  "payment_method_data": {
    "type": "momo",
    "momo": {
      "country": "cg",
      "msisdn": "+2420XXXXXXXX",
      "operator_name": "mtn"
    }
  }
}
```

#### `createDisbursement({ netAmount, firstName, lastName, msisdn, operatorName })`
Appeler:

```http
POST /v1/disbursements
```

Points importants:
- Yabetoo prélève ici `1.5%` sur les décaissements;
- pour que l'utilisateur reçoive exactement le net, le code initie `netAmount * 1.015` arrondi au supérieur;
- pour le `disbursement`, le MSISDN est envoyé sans `+`;
- le pays est `CG`.

#### `getPaymentIntent(intentId)`
Appeler:

```http
GET /v1/payment-intents/:intentId
```

---

## 4. Route API d'encaissement

Créer une route du genre `app/api/payment/create-intent/route.js`.

### Contrôles à faire
- authentifier l'utilisateur;
- vérifier que la transaction locale appartient bien à l'utilisateur;
- valider le type d'opération;
- imposer le montant serveur pour les frais de validation;
- refuser les montants trop bas pour les dépôts;
- créer d'abord l'intent chez Yabetoo;
- enregistrer ensuite la transaction locale avec `reference = intent.id`;
- confirmer l'intent pour déclencher le paiement mobile.

### Pattern local utilisé ici

Le dépôt crée d'abord une ligne dans `ec_transactions`:
- `status = pending`
- `reference = intent.id`
- `metadata.provider = yabetoo`
- `metadata.flow = payment_intent`

Ensuite il confirme l'intent avec le `clientSecret`.

### Cas d'usage supportés ici
- `validation`
- `deposit`

### Règles métier
- le montant de validation est forcé côté serveur;
- le dépôt a un minimum configurable;
- les erreurs de création ou de confirmation doivent être remontées au client;
- les logs serveur doivent conserver l'`intentId`, `userId` et le statut provider.

---

## 5. Webhook Yabetoo

Créer une route du genre `app/api/payment/webhook/route.js`.

### Points critiques
1. Lire le corps brut avec `request.text()`.
2. Vérifier la signature `x-yabetoo-signature`.
3. Calculer le HMAC SHA-256 avec le secret.
4. Rejeter la requête si la signature ne matche pas.
5. Parser le JSON seulement après la validation.
6. Extraire un `reference` robuste à partir du payload.
7. Logger l'événement dans une table dédiée.
8. Traiter seulement les événements connus.
9. Appeler une RPC SQL atomique pour finaliser le workflow.

### Événements gérés ici

Succès:
- `intent.completed`
- `intent.succeeded`
- `payment_intent.succeeded`

Échec:
- `intent.failed`
- `payment_intent.payment_failed`

Expiration / annulation:
- `intent.expired`
- `payment_intent.canceled`
- `intent.canceled`

Décaissement:
- `disbursement.completed`
- `disbursement.failed`

### Extraction de référence

Le code essaie plusieurs champs:
- `data.id`
- `data.payment_intent_id`
- `data.intent.id`
- `data.charge.payment_intent_id`
- `payload.id`

### Traitement recommandé

#### Pour un paiement réussi
Appeler une RPC de type:

```sql
complete_payment_intent(p_reference, p_event)
```

#### Pour un paiement échoué ou expiré
Appeler:

```sql
fail_payment_intent(p_reference, p_status, p_error_message)
```

#### Pour un décaissement réussi
Appeler:

```sql
complete_withdrawal_webhook(p_reference, p_event)
```

#### Pour un décaissement échoué
Appeler:

```sql
finalize_withdrawal_request(...)
```

### Journalisation
Ce projet enregistre chaque webhook dans une table d'audit avec:
- `provider`
- `event_type`
- `reference`
- `status`
- `signature`
- `payload`
- `error_message`

Il faut garder ce pattern. Il simplifie énormément le debug et la reprise après incident.

---

## 6. Réconciliation planifiée

Le webhook ne doit pas être la seule source de vérité.

Créer un cron, comme `app/api/cron/reconcile/route.js`, qui:
- lit les transactions `pending`;
- interroge Yabetoo via `getPaymentIntent(reference)`;
- si l'état est payé, appelle `complete_payment_intent`;
- si l'état est failed/expired/canceled, appelle `fail_payment_intent`;
- limite le volume traité par exécution;
- protège l'accès avec un secret `CRON_SECRET`.

### Quand l'utiliser
- si le webhook est retardé;
- si le provider a envoyé un événement perdu;
- si tu veux corriger les cas limites de synchronisation.

---

## 7. Modèle de données

Le pattern utilisé ici repose sur une table `ec_transactions` avec au minimum:
- `id`
- `user_id`
- `type`
- `amount`
- `status`
- `description`
- `reference`
- `metadata`

Et une table d'audit webhook, par exemple `ec_webhook_events`.

### États attendus
- `pending` quand l'opération est créée mais pas encore confirmée;
- `completed` quand le provider a confirmé le mouvement;
- `failed` quand l'opération a échoué;
- `expired` quand le paiement n'a pas abouti à temps.

### Bonne pratique
La référence provider doit être unique et servir d'idempotency key logique:
- `reference = intent.id` pour les encaissements;
- `reference = disbursement.id` pour les retraits;
- une référence temporaire peut exister seulement pendant la réservation du retrait.

---

## 8. Fonctions SQL atomiques

Le plus important dans cette intégration n'est pas l'appel HTTP, mais la mise à jour atomique des soldes.

### Fonction de complétion de paiement
`complete_payment_intent(p_reference, p_event)` doit:
- verrouiller la transaction `pending` correspondante;
- passer le statut à `completed`;
- ajouter `completed_event` et `completed_at` dans `metadata`;
- créditer le solde si le type est `deposit`;
- activer le compte si le type est `validation`;
- distribuer les bonus de parrainage si nécessaire.

### Fonction d'échec
`fail_payment_intent(p_reference, p_status, p_error_message)` doit:
- basculer la transaction vers `failed` ou `expired`;
- enrichir la description avec le message d'erreur;
- rester idempotente.

### Retrait
Pour les retraits, utiliser deux étapes:
1. `create_withdrawal_request(...)`
2. `finalize_withdrawal_request(...)`

Le retrait doit réserver le solde immédiatement, puis le remettre si l'appel provider échoue.

---

## 9. Gestion des retraits

La logique de retrait reprise ici est importante à copier telle quelle.

### Processus
1. Vérifier le montant minimum et maximum.
2. Appeler `create_withdrawal_request` pour:
   - vérifier le compte validé,
   - vérifier le solde,
   - créer une transaction `pending`,
   - débiter immédiatement le solde localement.
3. Appeler `createDisbursement` chez Yabetoo.
4. Si succès:
   - remplacer la référence temporaire par la vraie référence provider;
   - garder la transaction en attente du webhook de confirmation.
5. Si échec:
   - appeler la RPC de rollback/finalisation en `failed`;
   - restaurer les fonds.

### Attention
Le retrait ne doit jamais laisser le solde local dans un état ambigu.
Le fait de réserver d'abord, puis d'annuler en cas d'erreur, évite les doubles sorties.

---

## 10. Sécurité

À reproduire obligatoirement:
- authentification côté route avant tout appel Yabetoo;
- contrôle d'appartenance de la transaction avant polling;
- validation de signature sur le webhook;
- secret dédié au cron;
- stockage des opérations dans la base avant traitement métier;
- RPC SQL en `SECURITY DEFINER` pour les changements sensibles.

### Anti-patterns à éviter
- faire confiance au client pour le montant final;
- mettre à jour le solde directement depuis le webhook sans fonction atomique;
- ignorer l'idempotence;
- dépendre uniquement du webhook sans mécanisme de rattrapage;
- accepter un `reference` non vérifié.

---

## 11. Exemple de structure à copier

```text
lib/
  yabetoo.js

app/api/payment/
  create-intent/route.js
  webhook/route.js

app/api/cron/
  reconcile/route.js

app/api/disbursement/
  route.js

supabase/
  schema.sql
  migrations/
```

---

## 12. Checklist d'intégration pour un autre projet

1. Créer le module Yabetoo central avec sandbox/production.
2. Ajouter la normalisation MSISDN et la détection opérateur.
3. Créer une route API d'encaissement qui:
   - authentifie,
   - crée l'intent,
   - enregistre la transaction,
   - confirme l'intent.
4. Créer une route webhook avec:
   - vérification HMAC,
   - audit log,
   - idempotence,
   - RPC SQL de finalisation.
5. Ajouter un cron de réconciliation.
6. Mettre en place les fonctions SQL atomiques.
7. Ajouter le flux de retrait avec réservation préalable.
8. Tester les cas:
   - succès,
   - échec,
   - expiration,
   - webhook dupliqué,
   - webhook absent,
   - référence inconnue.

---

## 13. Ce que ce dépôt fait de bien

- séparation nette entre l'API provider et la logique métier;
- statut local piloté par la base plutôt que par le front;
- webhook sécurisé par HMAC;
- réconciliation pour récupérer les cas perdus;
- traitement distinct des encaissements et décaissements;
- journalisation exploitable en production.

Si un autre agent IA doit intégrer Yabetoo dans un nouveau projet, il doit reprendre cette architecture avant de s'occuper de l'interface utilisateur.
