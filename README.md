# Asmodra

Plateforme SaaS de generation de flyers IA pour le marche congolais.

## Ce qui est branche

- `Supabase` pour auth, base, RLS et storage
- `OpenRouter`, `Puter.js` ou `Pollinations.ai` (hybride) pour l'optimisation du prompt et la generation image
- `GPT-5 Image Mini` via OpenRouter pour la sortie visuelle
- `Yabetoo Pay` pour les abonnements Mobile Money
- `Sharp` pour le watermark cote serveur sur le plan gratuit
- `Telegram` pour les alertes de vente

## Regles produit implementees

- pas d'historique visuel expose a l'utilisateur
- credits mensuels par plan + packs de credits
- watermark obligatoire sur `starter`
- activation d'abonnement uniquement apres webhook ou reconciliation
- aucun montant ou quota ne vient du client

## Mise en route

1. Copier `.env.example` vers `.env.local`
2. Renseigner les cles Supabase + IA (`AI_PROVIDER=openrouter|puter`), puis Yabetoo et Telegram si tu veux les alertes
3. Executer le SQL de `supabase/schema.sql` dans Supabase
4. Lancer `npm run dev`

## Fichiers clefs

- `lib/` : auth, securite, OpenRouter, Yabetoo, Supabase
- `app/api/` : routes serveur reelles
- `components/` : formulaires fonctionnels
- `SECURITY_RULES.md` : garde-fous a respecter

## Notes de securite

- ne jamais commiter de vraies cles dans `.env`
- faire tourner le webhook Yabetoo avec `YABETOO_WEBHOOK_SECRET`
- proteger la reconciliation avec `CRON_SECRET`
- reserver la `service_role` au serveur uniquement
- pour Telegram, ajouter `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID`

## Choix du provider IA

- `AI_PROVIDER=openrouter` : utilise OpenRouter (`OPENROUTER_API_KEY` + modeles OpenRouter)
- `AI_PROVIDER=puter` : utilise Puter.js (`PUTER_AUTH_TOKEN` + modeles Puter)
- `AI_PROVIDER=pollinations` : utilise Pollinations.ai (`POLLINATIONS_*`)
- **Important sur le cout** : Puter fonctionne en modele **user-pays**. Le compte lie a `PUTER_AUTH_TOKEN` peut etre facture selon l'usage/modeles choisis. Ce n'est pas une garantie d'usage illimite sans cout.
