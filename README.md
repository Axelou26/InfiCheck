# Inficheck

Application mobile (Expo 57) d’aide à la **prescription infirmière** pour les **IDEL**, fondée sur l’arrêté du 26 juin 2026 (`SFHH2617311A`).

## Stack

- Expo SDK 57 · React Native · TypeScript
- React Navigation
- SQLite locale (`expo-sqlite`) — offline-first
- Médicaments : **import BDPM officiel** (`npm run import:bdpm`) — les 11 fichiers de la [page Téléchargement](https://base-donnees-publique.medicaments.gouv.fr/telechargement)

## Démarrer

```bash
npm install
npm start
```

Scanner le QR code avec Expo Go (Android / iOS).

## Mettre à jour la BDPM

```bash
npm run import:bdpm
```

Pour pousser le contenu aux appareils **sans nouveau build store** :

```bash
npm run publish:content -- --base-url https://VOTRE_CDN/inficheck/content
```

Uploadez `dist/content/`, définissez `EXPO_PUBLIC_CONTENT_MANIFEST_URL` (voir `.env.example`), puis rebuild **une fois** pour embarquer l’URL.  
Détail : `scripts/CONTENT_UPDATES.md`.

Le rattachement des spécialités aux items de l’arrêté suit une liste blanche stricte
(`scripts/eligibility.mjs`). Après toute modification des règles ou mise à jour de la base :

```bash
npm run audit:eligibility
```

Voir `scripts/IMPORT_BDPM.md` pour le détail.

## MVP

- Accueil IDEL + disclaimer
- Catalogue des 6 domaines de l’arrêté
- Fiches item (prescrire / renouveler, conditions, obligations)
- Recherche arrêté + médicaments
- Médicaments BDPM (~15 000 spécialités) + badge éligibilité IDE (autorisé / sous conditions / hors liste)
- Checklist Art. 2 / 3 / Annexe II
- Mentions légales + liens Légifrance / BDPM

## Important

Outil d’aide. **Seul le Journal officiel / Légifrance fait foi.**  
Données médicaments : [BDPM](https://base-donnees-publique.medicaments.gouv.fr) — citer la source et la date.
