# Security Rules

Ces regles sont le socle a respecter pour Asmodra.

1. Les montants, quotas, plans actifs et decisions de watermark sont imposes cote serveur.
2. Aucun prompt utilisateur n'est envoye brut au modele image sans filtrage local et revue OpenRouter.
3. Les routes sensibles appliquent un rate limiting minimal cote serveur.
4. Les webhooks paiement sont rejetes sans verification HMAC.
5. Les cles `service_role`, `openrouter` et `yabetoo` ne sortent jamais du serveur.
6. Les assets importes sont limites en taille et type MIME.
7. Les pages protegees ne font jamais confiance a `getSession()` seule; la verification passe par Supabase cote serveur.
8. Aucune page utilisateur n'expose l'historique des generations; seules des traces techniques minimales existent pour audit et quota.
9. Les transactions de paiement gardent un statut local avant toute activation d'abonnement.
10. Les headers de securite HTTP sont actifs globalement via Next.js.
