/**
 * Recalcule l'éligibilité IDE sur la base déjà importée, sans retélécharger la BDPM.
 *
 * Usage : node scripts/reapply-eligibility.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { evaluerEligibilite, NIVEAU } from './eligibility.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'assets', 'bdpm', 'inficheck.db');
const META_PATH = path.join(ROOT, 'assets', 'bdpm', 'meta.json');

const SQL = await initSqlJs();
const db = new SQL.Database(fs.readFileSync(DB_PATH));
const table = db.exec(
  'SELECT cis, nom, substances, forme, voies FROM medicaments',
)[0];
const meds = table.values.map((row) => Object.fromEntries(table.columns.map((c, i) => [c, row[i]])));

const update = db.prepare(`
  UPDATE medicaments
  SET eligible_ide = ?, niveau_ide = ?, item_arrete_id = ?, conditions_ide = ?
  WHERE cis = ?
`);

let eligible = 0;
let oui = 0;
let conditions = 0;
const parItem = new Map();

db.run('BEGIN');
for (const med of meds) {
  const substances =
    !med.substances || med.substances === '—' ? [] : String(med.substances).split(' | ');
  const verdict = evaluerEligibilite({
    nom: med.nom,
    substancesBrutes: substances,
    forme: med.forme,
    voies: med.voies,
  });
  if (verdict) {
    eligible += 1;
    if (verdict.niveau === NIVEAU.OUI) oui += 1;
    else conditions += 1;
    parItem.set(verdict.itemArreteId, (parItem.get(verdict.itemArreteId) ?? 0) + 1);
  }
  update.run([
    verdict ? 1 : 0,
    verdict ? verdict.niveau : NIVEAU.NON,
    verdict ? verdict.itemArreteId : null,
    verdict ? verdict.conditionsIde : null,
    med.cis,
  ]);
}
update.free();
db.run('COMMIT');

db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
  'bdpm_eligible_count',
  String(eligible),
]);
db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
  'bdpm_eligible_oui_count',
  String(oui),
]);
db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [
  'bdpm_eligible_conditions_count',
  String(conditions),
]);

const exported = db.export();
fs.writeFileSync(DB_PATH, Buffer.from(exported));
db.close();

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
meta.eligibleIdeApprox = eligible;
meta.eligibleIdeOui = oui;
meta.eligibleIdeConditions = conditions;
fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n');

console.log(`Éligibles : ${eligible} (oui ${oui}, conditions ${conditions})`);
for (const [item, n] of [...parItem.entries()].sort()) {
  console.log(`  ${item.padEnd(28)} ${n}`);
}
