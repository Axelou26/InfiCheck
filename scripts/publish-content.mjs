#!/usr/bin/env node
/**
 * Prépare un paquet de contenu à héberger (CDN / GitHub Releases / R2).
 *
 * Usage :
 *   npm run publish:content
 *   npm run publish:content -- --notes "BDPM du 5 septembre"
 *   npm run publish:content -- --base-url https://cdn.example.com/inficheck/content
 *
 * Produit `dist/content/manifest.json` + `dist/content/inficheck.db`.
 * L’app lit le manifeste via EXPO_PUBLIC_CONTENT_MANIFEST_URL.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const META_PATH = path.join(ROOT, 'assets', 'bdpm', 'meta.json');
const DB_PATH = path.join(ROOT, 'assets', 'bdpm', 'inficheck.db');
const OUT_DIR = path.join(ROOT, 'dist', 'content');

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function main() {
  if (!fs.existsSync(META_PATH) || !fs.existsSync(DB_PATH)) {
    console.error('Base manquante. Lancez d’abord : npm run import:bdpm');
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
  const importedAt = String(meta.importedAt).slice(0, 10);
  const catalogVersion = String(meta.catalogVersion ?? '0');
  const contentVersion = `${importedAt}+${catalogVersion}`;
  const bytes = fs.statSync(DB_PATH).size;
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(DB_PATH)).digest('hex');

  const notes =
    argValue('--notes') ??
    `BDPM ${importedAt} · catalogue ${catalogVersion} · ${meta.eligibleIdeApprox} spécialités IDE`;

  const baseUrl = (argValue('--base-url') ?? '').replace(/\/$/, '');
  const dbUrl = baseUrl ? `${baseUrl}/inficheck.db` : 'inficheck.db';

  const manifest = {
    schema: 1,
    contentVersion,
    importedAt,
    catalogVersion,
    cisCount: meta.cisCount,
    eligibleIdeApprox: meta.eligibleIdeApprox,
    notes,
    publishedAt: new Date().toISOString(),
    db: {
      url: dbUrl,
      bytes,
      sha256,
    },
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.copyFileSync(DB_PATH, path.join(OUT_DIR, 'inficheck.db'));
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log('Paquet contenu prêt :');
  console.log(`  ${path.join(OUT_DIR, 'manifest.json')}`);
  console.log(`  ${path.join(OUT_DIR, 'inficheck.db')} (${bytes.toLocaleString('fr-FR')} o)`);
  console.log(`  contentVersion = ${contentVersion}`);
  console.log(`  sha256 = ${sha256}`);
  console.log('');
  console.log('Ensuite :');
  console.log('  1. Uploadez dist/content/ sur votre CDN / bucket / GitHub Release');
  console.log('  2. Définissez EXPO_PUBLIC_CONTENT_MANIFEST_URL=https://…/manifest.json');
  console.log('  3. Rebuild l’app (une fois) pour embarquer l’URL — les MAJ suivantes sont OTA');
}

main();
