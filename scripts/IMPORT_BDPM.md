# Import BDPM (base réelle)

Source officielle : https://base-donnees-publique.medicaments.gouv.fr/telechargement  
Licence Ouverte — citer la source et la date de mise à jour. Ne pas dénaturer les données.

## Lancer l’import

```bash
npm run import:bdpm
```

Cela télécharge **les 11 fichiers** de la page Téléchargement, puis construit `assets/bdpm/inficheck.db` :

| Fichier | Contenu |
|---------|---------|
| `CIS_bdpm.txt` | Spécialités |
| `CIS_CIP_bdpm.txt` | Présentations (CIP, prix, remboursement) |
| `CIS_COMPO_bdpm.txt` | Compositions |
| `CIS_HAS_SMR_bdpm.txt` | Avis SMR HAS |
| `CIS_HAS_ASMR_bdpm.txt` | Avis ASMR HAS |
| `HAS_LiensPageCT_bdpm.txt` | Liens avis commission de la transparence |
| `CIS_GENER_bdpm.txt` | Groupes génériques |
| `CIS_CPD_bdpm.txt` | Conditions de prescription et de délivrance |
| `CIS_CIP_Dispo_Spec.txt` | Ruptures / tensions / disponibilités |
| `CIS_MITM.txt` | Médicaments d’intérêt thérapeutique majeur |
| `CIS_InfoImportantes.txt` | Informations importantes (généré à la volée) |

L’app copie cette base bundlée dans le stockage local au premier lancement (ou après un paquet embarqué plus récent).

Pour pousser une mise à jour **sans republier l’app** (CDN + manifeste) :

```bash
npm run publish:content
```

Voir [CONTENT_UPDATES.md](./CONTENT_UPDATES.md).

Pour rejouer l’import sans retélécharger les fichiers déjà présents dans `scripts/bdpm-raw/` :

```bash
npm run import:bdpm -- --skip-download
```

## Croisement arrêté

Le rattachement d’une spécialité à un item de l’arrêté est décidé par `scripts/eligibility.mjs`,
sur le principe d’une **liste blanche stricte** : toutes les substances actives doivent figurer
dans la liste de la règle et toutes les voies d’administration doivent être autorisées. Une seule
substance ou voie inconnue écarte la spécialité.

Ce choix privilégie le faux négatif (spécialité éligible non signalée, l’IDE se reporte au texte)
au faux positif (produit hors liste affiché comme prescriptible). Il élimine notamment les
associations de palier II ou III, l’aspirine à visée antiagrégante, les formes injectables, les
contraceptifs non oraux et les progestatifs à indication gynécologique.

Trois niveaux sont stockés dans la colonne `niveau_ide` :

| Niveau | Sens |
|--------|------|
| `oui` | Cadre clair, prescription ou renouvellement IDE possible |
| `conditions` | Rattachée à l’arrêté mais l’indication doit être vérifiée |
| `non` | Hors liste |

Après toute modification des règles ou mise à jour de la BDPM :

```bash
npm run audit:eligibility
```

L’audit rejoue les règles sur la base construite et vérifie une liste de cas de référence
(produits qui doivent être rattachés, produits qui ne doivent jamais l’être). Il sort en erreur
dès qu’un cas régresse. Les règles restent à faire valider par un pharmacien ou un référent métier.

## Fichiers projet

| Fichier | Rôle |
|---------|------|
| `scripts/import-bdpm.mjs` | Pipeline d’import |
| `scripts/eligibility.mjs` | Règles de croisement arrêté ↔ BDPM |
| `scripts/audit-eligibility.mjs` | Vérification des règles sur la base construite |
| `scripts/arrete-items.json` | Catalogue arrêté embarqué dans la DB |
| `assets/bdpm/inficheck.db` | Base SQLite livrée avec l’app |
| `assets/bdpm/meta.json` | Métadonnées d’import |
