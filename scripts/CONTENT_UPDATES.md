# Mises à jour de contenu (sans republier l’app)

L’app embarque une base SQLite (`assets/bdpm/inficheck.db`).  
Les mises à jour **OTA** remplacent ce fichier sur l’appareil à partir d’un **manifeste JSON** hébergé hors store.

## Flux

```
npm run import:bdpm          # reconstruit la DB locale
npm run publish:content      # produit dist/content/{manifest.json,inficheck.db}
↑ upload CDN / R2 / GitHub Release
appareil → GET manifest.json → si plus récent → télécharge ~40 Mo → valide → remplace SQLite
```

## Manifeste

```json
{
  "schema": 1,
  "contentVersion": "2026-08-23+2026-08-22-all",
  "importedAt": "2026-08-23",
  "catalogVersion": "2026-08-22-all",
  "cisCount": 15857,
  "eligibleIdeApprox": 506,
  "notes": "BDPM du 23 août",
  "db": {
    "url": "https://cdn.example.com/inficheck/content/inficheck.db",
    "bytes": 42000000,
    "sha256": "…"
  }
}
```

`contentVersion` = `importedAt(AAAA-MM-JJ)+catalogVersion`.  
Comparaison lexicographique : une version plus grande remplace la locale.  
Un build d’app avec une base bundlée **plus récente** que l’OTA remplace aussi la locale (jamais de downgrade).

## Configuration app

Dans `.env` (ou variables EAS) :

```bash
EXPO_PUBLIC_CONTENT_MANIFEST_URL=https://cdn.example.com/inficheck/content/manifest.json
```

Sans cette variable, l’app reste 100 % hors ligne sur la base bundlée (pas d’appel réseau).

Exemple de publication avec URL absolue déjà écrite dans le manifeste :

```bash
npm run publish:content -- --base-url https://cdn.example.com/inficheck/content --notes "BDPM septembre"
```

## Côté appareil

- Vérification auto au démarrage (si URL configurée), puis au plus toutes les 30 min au retour foreground
- Bannière sur l’accueil + carte dans **Mentions** et **Liste IDE**
- Validation : taille ±2 %, `COUNT(medicaments)`, date d’import et version catalogue
- Après installation : consultation offline inchangée

## Hébergement recommandé

| Option | Intérêt |
|--------|---------|
| Cloudflare R2 / S3 | Pas cher pour ~40 Mo, HTTPS |
| GitHub Releases | Simple au début (`…/releases/download/content-…/`) |
| Bunny / Fastly | CDN Europe, bon pour les IDEL |

HTTPS obligatoire en production. Ne pas committer `dist/content/` (régénérable).
