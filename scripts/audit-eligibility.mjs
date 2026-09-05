/**
 * Audit du croisement arrêté ↔ BDPM.
 *
 * Rejoue les règles de scripts/eligibility.mjs sur assets/bdpm/inficheck.db et
 * vérifie une liste de cas de référence (produits qui DOIVENT être rattachés et
 * produits qui NE DOIVENT PAS l'être). Sort en échec si un cas régresse.
 *
 * Usage : npm run audit:eligibility
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { canonicalSubstance, evaluerEligibilite, NIVEAU } from './eligibility.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'assets', 'bdpm', 'inficheck.db');

/** Spécialités qui doivent être rattachées à un item donné. */
const DOIT_ETRE_RATTACHE = [
  ['DOLIPRANE 1000 mg', 'prod-antalgiques'],
  ['ADVIL 400 mg', 'prod-antalgiques'],
  ['ASPEGIC ADULTES 1000 mg', 'prod-antalgiques'],
  ['NICOPATCH', 'tabac-substituts'],
  ['NICORETTE', 'tabac-substituts'],
  ['ELLAONE 30 mg', 'sex-urgence'],
  ['NORLEVO 1,5 mg', 'sex-urgence'],
  ['LEELOO', 'sex-contraception-orale'],
  ['MINIDRIL', 'sex-contraception-orale'],
  ['CERAZETTE', 'sex-contraception-orale'],
  ['MICROVAL', 'sex-contraception-orale'],
  ['SLINDA 4 mg', 'sex-contraception-orale'],
  ['QLAIRA', 'sex-contraception-orale'],
  ['ZOELY', 'sex-contraception-orale'],
  ['EMLA 5 POUR CENT', 'plaie-anesthesiques'],
  ['BETADINE DERMIQUE', 'prod-solutions'],
  ['BISEPTINE', 'prod-solutions'],
  ['DAKIN COOPER', 'prod-solutions'],
  ['AMUKINE', 'prod-solutions'],
  ['HEXOMEDINE 1 POUR MILLE', 'prod-solutions'],
];

/** Spécialités qui ne doivent jamais apparaître comme prescriptibles par l'IDE. */
const NE_DOIT_PAS_ETRE_RATTACHE = [
  ['IXPRIM', 'tramadol = palier II'],
  ['TRAMADOL/PARACETAMOL', 'tramadol = palier II'],
  ['LAMALINE', 'opium = palier II'],
  ['IZALGI', 'opium = palier II'],
  ['CODOLIPRANE', 'codéine = palier II'],
  ['DAFALGAN CODEINE', 'codéine = palier II'],
  ['KARDEGIC', 'aspirine antiagrégante'],
  ['ASPIRINE PROTECT', 'aspirine antiagrégante'],
  ['RESITUNE', 'aspirine antiagrégante'],
  ['DUOPLAVIN', 'clopidogrel'],
  ['MIGPRIV', 'métoclopramide'],
  ['FERVEX', 'antihistaminique / décongestionnant'],
  ['ACIDE ACETYLSALICYLIQUE PANPHARMA', 'forme injectable'],
  ['NEXPLANON', 'implant, hors contraception orale'],
  ['NUVARING', 'anneau vaginal, hors contraception orale'],
  ['EVRA', 'patch, hors contraception orale'],
  ['ANDROCUR', 'antiandrogène, non contraceptif'],
  ['DIANE 35', 'indication acné, hors Annexe II'],
  ['CHLORMADINONE SANDOZ', 'progestatif non contraceptif'],
  ['LUTENYL', 'progestatif non contraceptif'],
  ['DIMETRUM', 'diénogest = endométriose'],
  ['DUOVA', 'traitement hormonal de la ménopause'],
  ['RYEQO', 'fibrome utérin'],
  ['CHLORURE DE SODIUM HYPERTONIQUE', 'solution hospitalière injectable'],
  ['CHLORURE DE SODIUM 0,9', 'solution injectable / perfusion'],
  ['ACCUSOL', 'hémofiltration'],
  ['BICAVERA', 'dialyse péritonéale'],
  ['AMINOMIX', 'nutrition parentérale'],
  ['COLLUDOL', 'collutoire, hors cadre plaie'],
  ['DYNEXAN', 'crème buccale, hors cadre plaie'],
  ['AFTAGEL', 'gel buccal, hors cadre plaie'],
  ['GLYDO', 'gel urétral / intravésical'],
  ['FORTACIN', 'éjaculation précoce'],
  ['VERSATIS', 'douleur neuropathique post-zostérienne'],
  ['ONCTOSE', 'association corticoïde / antihistaminique'],
  ['OSMOGEL', 'sulfate de magnésium'],
  ['EPIDUO', 'traitement de l’acné'],
  ['CUTACNYL', 'traitement de l’acné'],
  ['ENCALLIK', 'contient un antibiotique'],
  ['TRUE TEST', 'patch de tests épicutanés'],
  ['LIDOCAINE AGUETTANT', 'forme injectable'],
];

const SQL = await initSqlJs();
const db = new SQL.Database(fs.readFileSync(DB_PATH));
const table = db.exec(
  `SELECT cis, nom, substances, forme, voies, etat_commercialisation FROM medicaments`,
)[0];
const meds = table.values.map((v) => Object.fromEntries(table.columns.map((c, i) => [c, v[i]])));

const resultats = meds.map((m) => ({
  ...m,
  verdict: evaluerEligibilite({
    nom: m.nom,
    substancesBrutes: String(m.substances) === '—' ? [] : String(m.substances).split(' | '),
    forme: m.forme,
    voies: m.voies,
  }),
}));

const commercialisee = (m) => /^commercialis/i.test(String(m.etat_commercialisation).trim());
const rattachees = resultats.filter((r) => r.verdict);

console.log(`Spécialités BDPM analysées : ${meds.length}`);
console.log(`Rattachées à un item de l'arrêté : ${rattachees.length}`);
console.log(`  dont commercialisées : ${rattachees.filter(commercialisee).length}`);

const parItem = new Map();
for (const r of rattachees) {
  const key = `${r.verdict.itemArreteId} [${r.verdict.niveau}]`;
  if (!parItem.has(key)) parItem.set(key, []);
  parItem.get(key).push(r);
}
console.log('\nRépartition par item et niveau');
for (const [key, list] of [...parItem.entries()].sort()) {
  console.log(
    `  ${key.padEnd(38)} ${String(list.length).padStart(4)}  (commercialisées: ${list.filter(commercialisee).length})`,
  );
}

const niveaux = new Map();
for (const r of rattachees) {
  niveaux.set(r.verdict.niveau, (niveaux.get(r.verdict.niveau) ?? 0) + 1);
}
console.log('\nNiveaux');
for (const n of [NIVEAU.OUI, NIVEAU.CONDITIONS]) {
  console.log(`  ${n.padEnd(12)} ${niveaux.get(n) ?? 0}`);
}

const echecs = [];

console.log('\nCas de référence — doivent être rattachés');
for (const [motif, itemAttendu] of DOIT_ETRE_RATTACHE) {
  const candidats = resultats.filter((r) => String(r.nom).toUpperCase().includes(motif.toUpperCase()));
  if (!candidats.length) {
    console.log(`  ?  ${motif} — absent de la BDPM importée`);
    continue;
  }
  const ok = candidats.filter((c) => c.verdict?.itemArreteId === itemAttendu);
  if (ok.length) {
    console.log(`  OK ${motif} → ${itemAttendu} (${ok.length}/${candidats.length})`);
  } else {
    echecs.push(`${motif} devrait être rattaché à ${itemAttendu}`);
    console.log(`  KO ${motif} → attendu ${itemAttendu}, obtenu ${candidats[0].verdict?.itemArreteId ?? 'aucun'}`);
  }
}

console.log('\nCas de référence — ne doivent pas être rattachés');
for (const [motif, raison] of NE_DOIT_PAS_ETRE_RATTACHE) {
  const candidats = resultats.filter((r) => String(r.nom).toUpperCase().includes(motif.toUpperCase()));
  if (!candidats.length) {
    console.log(`  ?  ${motif} — absent de la BDPM importée`);
    continue;
  }
  const fuites = candidats.filter((c) => c.verdict);
  if (!fuites.length) {
    console.log(`  OK ${motif} écarté (${raison})`);
  } else {
    echecs.push(`${motif} ne doit pas être rattaché (${raison})`);
    console.log(`  KO ${motif} rattaché à ${fuites[0].verdict.itemArreteId} — ${raison}`);
    for (const f of fuites.slice(0, 3)) console.log(`       ${f.nom}`);
  }
}

// Substances non reconnues les plus fréquentes : sert à repérer les dénominations
// BDPM nouvelles ou irrégulières après une mise à jour.
const substancesConnues = new Set();
for (const r of rattachees) {
  for (const s of String(r.substances).split(' | ')) substancesConnues.add(canonicalSubstance(s));
}
console.log(`\nSubstances canoniques rattachées : ${substancesConnues.size}`);
console.log([...substancesConnues].sort().join(', '));

if (echecs.length) {
  console.error(`\n${echecs.length} cas de référence en échec :`);
  for (const e of echecs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\nTous les cas de référence passent.');
