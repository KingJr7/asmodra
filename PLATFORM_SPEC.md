# Asmodra — Spécification produit (V1)

## 1) Vision
Asmodra est une plateforme web de génération de flyers professionnels par IA, pensée pour les freelances et community managers au Congo-Brazzaville.  
Objectif: produire rapidement des visuels marketing de qualité, prêts à publier ou imprimer, avec un parcours simple et orienté résultat.

## 2) Positionnement
- **Type de produit**: SaaS web (pas d’application mobile en V1)
- **Marché de lancement**: Congo-Brazzaville
- **Langue de lancement**: Français uniquement
- **Référence inspiration**: expérience similaire à wisegen.app, adaptée au contexte local
- **Style de marque/UI**: Dark premium

## 3) Utilisateurs cibles
### Cible prioritaire
- Freelances / Community managers

### Besoin principal
- Générer des flyers professionnels rapidement pour promotions, événements, offres commerciales et communication client.

## 4) Proposition de valeur
- Génération assistée par IA en quelques secondes
- Templates métiers pour accélérer la création
- Formats adaptés aux réseaux sociaux + impression
- Paiement local via mobile money (Airtel + MTN) via Yabetoo Pay

## 5) Offre commerciale
## Freemium
- **Gratuit**: 8 crédits / mois (~1 génération)
- **Watermark**: oui sur le plan gratuit

## Abonnements payants
- **Pro**: 15 000 FCFA / mois, 250 crédits / mois
- **Business**: 25 000 FCFA / mois, 480 crédits / mois (~60 générations / mois)
- **Renouvellement**: manuel (pas d’auto-renouvellement en V1)
- **Packs crédits**: One-shot (500 FCFA, 8 crédits), Micro Recharge (2 000 FCFA, 40 crédits), Pack Créateur (5 000 FCFA, 120 crédits), Pack Business (10 000 FCFA, 250 crédits), Pack Volume (20 000 FCFA, 550 crédits)

## 6) Paiements
- **Méthodes**: Airtel Money + MTN Mobile Money
- **Passerelle**: Yabetoo Pay
- **Exigences V1**:
  - création d’une transaction d’abonnement
  - confirmation de paiement
  - activation / mise à jour du plan utilisateur
  - journalisation des transactions en base

## 7) Parcours utilisateur (V1)
1. Inscription / connexion (Email + mot de passe, ou Google)
2. Choix de template ou mode génération IA
3. Saisie des informations de création:
   - prompt texte
   - upload image/logo
   - informations business (nom, contact, etc.)
4. Lancement génération
5. Prévisualisation
6. Téléchargement direct (sans éditeur intégré)
7. Décrément des crédits (coût variable selon format et uploads)

## 8) Génération & formats
## Formats obligatoires
- Carré 1080x1080
- Story 1080x1920
- A4 impression

## Moteur IA souhaité
- GPT-5 Image Mini (image) + GPT-4.1 Mini (optimisation prompt)
- Intégration via OpenRouter

## Modération
- Blocage des prompts sensibles / inappropriés (content safety activée)

## 9) Templates
- **Présence en V1**: oui
- **Volume initial**: 10 catégories
- **Exemples de catégories**: promo commerce, restauration, beauté, événement, immobilier, services pro, e-commerce, éducation, santé/bien-être, annonces diverses.

## 10) Édition
- **V1**: aucune édition post-génération (téléchargement direct uniquement)

## 11) Admin (V1)
Un espace administrateur est requis dès la V1 pour:
- gestion des utilisateurs
- suivi des abonnements
- suivi des paiements
- suivi de la génération de flyers

## KPI prioritaires
- nouveaux utilisateurs
- conversions payantes
- nombre de flyers générés

## 12) Support client
- **Canal V1**: WhatsApp

## 13) Conformité & légal
Pages légales requises en V1:
- CGU
- Politique de confidentialité
- Mentions légales

## 14) Stack technique cible (V1)
- **Frontend**: Next.js (App Router, TypeScript)
- **Backend/DB/Auth**: Supabase
- **Storage fichiers**: Supabase Storage
- **Paiement**: Yabetoo Pay (Airtel Money + MTN MoMo)
- **IA image**: GPT-5 Image Mini via OpenRouter

## 15) Entités métier minimales
- `users` (profil, rôle, plan actif)
- `plans` (gratuit/pro/business + packs crédits, crédits, prix)
- `subscriptions` (statut, début, fin, renouvellement manuel)
- `transactions` (montant, canal, référence, statut)
- `generations` (prompt, format, résultat, statut, coût crédits)
- `assets` (logo/image uploadée, url storage)
- `templates` (catégorie, metadata, actif/inactif)

## 16) Règles métier clés
- Le solde de crédits dépend du plan actif + packs
- Le plan gratuit applique un watermark
- Aucune génération sans crédits suffisants
- Paiement validé => activation ou upgrade plan
- Les générations sont historisées pour l’utilisateur

## 17) Priorités MVP
1. Auth + onboarding
2. Système de plans/quota
3. Génération IA + export formats
4. Paiement mobile money via Yabetoo
5. Dashboard utilisateur (historique + quotas)
6. Admin + KPI
7. Pages légales + support WhatsApp

## 18) Nom produit
- **Marque**: Asmodra
