/**
 * Met à jour uniquement le catalogue arrêté dans assets/bdpm/inficheck.db
 * (sans retélécharger la BDPM).
 *
 * Usage : npm run import:catalog
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'bdpm');
const DB_PATH = path.join(OUT_DIR, 'inficheck.db');
const META_PATH = path.join(OUT_DIR, 'meta.json');
const ITEMS_PATH = path.join(__dirname, 'arrete-items.json');

const CATALOG_VERSION = '2026-08-22-all';

const ARRETE_ITEMS = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));

const SQL = await initSqlJs();
const db = new SQL.Database(fs.readFileSync(DB_PATH));

db.run('DELETE FROM arrete_items');
const insert = db.prepare(`
  INSERT INTO arrete_items
    (id, domaine, titre, description, modalite, conditions_json, obligations_json, references_txt, bdpm_keywords_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const item of ARRETE_ITEMS) {
  insert.run([
    item.id,
    item.domaine,
    item.titre,
    item.description,
    item.modalite,
    JSON.stringify(item.conditions),
    JSON.stringify(item.obligations),
    item.references,
    JSON.stringify(item.bdpmKeywords),
  ]);
}
insert.free();

db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
  'arrete_catalog_version',
  CATALOG_VERSION,
]);

const exported = db.export();
fs.writeFileSync(DB_PATH, Buffer.from(exported));
db.close();

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
meta.catalogVersion = CATALOG_VERSION;
fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

console.log(`Catalogue arrêté : ${ARRETE_ITEMS.length} fiches → ${DB_PATH}`);
console.log(`Version catalogue : ${CATALOG_VERSION}`);
