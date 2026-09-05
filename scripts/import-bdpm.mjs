/**
 * Import BDPM officielle (tous les fichiers de la page Téléchargement)
 * → assets/bdpm/inficheck.db
 *
 * Source : https://base-donnees-publique.medicaments.gouv.fr/telechargement
 * Licence Ouverte — citer la source et la date de mise à jour. Ne pas dénaturer.
 *
 * Le rattachement des spécialités aux items de l'arrêté est délégué à
 * ./eligibility.mjs (liste blanche stricte). Vérifier avec npm run audit:eligibility.
 *
 * Usage : npm run import:bdpm
 *         npm run import:bdpm -- --skip-download   (rejoue l'import sur scripts/bdpm-raw)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { evaluerEligibilite, NIVEAU } from './eligibility.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKIP_DOWNLOAD = process.argv.includes('--skip-download');
/** Doit rester aligné sur CATALOG_VERSION de update-catalog.mjs. */
const CATALOG_VERSION = '2026-08-22-all';
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(__dirname, 'bdpm-raw');
const OUT_DIR = path.join(ROOT, 'assets', 'bdpm');
const ORIGIN = 'https://base-donnees-publique.medicaments.gouv.fr';
const FILE_BASE = `${ORIGIN}/download/file`;

const UA = { 'User-Agent': 'Inficheck-Import/1.0 (BDPM licence ouverte)' };

/** Fichiers de https://base-donnees-publique.medicaments.gouv.fr/telechargement */
const FILES = [
  { local: 'CIS_bdpm.txt', remote: ['CIS_bdpm.txt'] },
  { local: 'CIS_CIP_bdpm.txt', remote: ['CIS_CIP_bdpm.txt'] },
  { local: 'CIS_COMPO_bdpm.txt', remote: ['CIS_COMPO_bdpm.txt'] },
  { local: 'CIS_HAS_SMR_bdpm.txt', remote: ['CIS_HAS_SMR_bdpm.txt'] },
  { local: 'CIS_HAS_ASMR_bdpm.txt', remote: ['CIS_HAS_ASMR_bdpm.txt'] },
  { local: 'HAS_LiensPageCT_bdpm.txt', remote: ['HAS_LiensPageCT_bdpm.txt'] },
  { local: 'CIS_GENER_bdpm.txt', remote: ['CIS_GENER_bdpm.txt'] },
  { local: 'CIS_CPD_bdpm.txt', remote: ['CIS_CPD_bdpm.txt'] },
  { local: 'CIS_CIP_Dispo_Spec.txt', remote: ['CIS_CIP_Dispo_Spec.txt'] },
  { local: 'CIS_MITM.txt', remote: ['CIS_MITM.txt'] },
  {
    local: 'CIS_InfoImportantes.txt',
    remote: ['CIS_InfoImportantes.txt'],
    extraUrls: [
      `${ORIGIN}/telechargement.php?fichier=CIS_InfoImportantes.txt`,
      `${ORIGIN}/download.php?fichier=CIS_InfoImportantes.txt`,
    ],
  },
];

const GENER_TYPE = {
  0: 'Princeps',
  1: 'Générique',
  2: 'Générique par complémentarité posologique',
  4: 'Générique substituable',
  5: 'Princeps substituable',
};

const DISPO_LIBELLE = {
  1: 'Rupture de stock',
  2: "Tension d'approvisionnement",
  3: 'Arrêt de commercialisation',
  4: 'Remise à disposition',
};

const ARRETE_ITEMS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'arrete-items.json'), 'utf8'),
);

function looksLikeHtml(buf) {
  const head = buf.subarray(0, 240).toString('utf8').trim().toLowerCase();
  return head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('<?xml');
}

function decodeBdpm(buf) {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString('utf8');
  }
  const utf8 = buf.toString('utf8');
  if (!utf8.includes('\uFFFD')) return utf8;
  return buf.toString('latin1');
}

function readBdpmLines(filePath) {
  const text = decodeBdpm(fs.readFileSync(filePath));
  return text.split(/\r?\n/).filter((l) => l.length > 0);
}

function col(cols, i) {
  return (cols[i] ?? '').trim();
}

async function fetchBuf(url) {
  const res = await fetch(url, {
    headers: UA,
    redirect: 'follow',
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function scrapeInfoImportantesUrl() {
  const html = (await fetchBuf(`${ORIGIN}/telechargement`)).toString('utf8');
  const matches = [...html.matchAll(/href=["']([^"']*InfoImportantes[^"']*)["']/gi)];
  if (!matches.length) return null;
  const href = matches[matches.length - 1][1];
  if (href.startsWith('http')) return href;
  if (href.startsWith('/')) return `${ORIGIN}${href}`;
  return `${ORIGIN}/${href}`;
}

async function download(file) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const dest = path.join(RAW_DIR, file.local);

  if (SKIP_DOWNLOAD) {
    if (!fs.existsSync(dest)) {
      throw new Error(`--skip-download mais fichier absent : ${dest}`);
    }
    console.log(`= ${file.local} (fichier local conservé)`);
    return dest;
  }

  const urls = [
    ...file.remote.map((name) => `${FILE_BASE}/${name}`),
    ...(file.extraUrls ?? []),
  ];
  if (file.local === 'CIS_InfoImportantes.txt') {
    try {
      const scraped = await scrapeInfoImportantesUrl();
      if (scraped) urls.unshift(scraped);
    } catch {
      /* fallback sur les URL connues */
    }
  }

  for (const url of urls) {
    console.log(`↓ ${url}`);
    try {
      const buf = await fetchBuf(url);
      if (looksLikeHtml(buf)) {
        console.log('  (HTML reçu, essai suivant)');
        continue;
      }
      if (buf.length < 40) {
        console.log(`  (fichier trop petit : ${buf.length} o)`);
        continue;
      }
      fs.writeFileSync(dest, buf);
      console.log(`  → ${dest} (${buf.length} octets)`);
      return dest;
    } catch (err) {
      console.log(`  échec : ${err.message}`);
    }
  }

  if (file.local === 'CIS_InfoImportantes.txt') {
    console.log('↓ résolution du lien « Informations importantes » depuis la page Téléchargement');
    const scraped = await scrapeInfoImportantesUrl();
    if (scraped) {
      const buf = await fetchBuf(scraped);
      if (!looksLikeHtml(buf) && buf.length >= 40) {
        fs.writeFileSync(dest, buf);
        console.log(`  → ${dest} (${buf.length} octets)`);
        return dest;
      }
    }
  }

  throw new Error(`Téléchargement impossible : ${file.local}`);
}

function parseCompoForEligibility(lines) {
  /** @type {Map<string, Set<string>>} */
  const map = new Map();
  for (const line of lines) {
    const cols = line.split('\t');
    const cis = col(cols, 0);
    const substance = col(cols, 3);
    const nature = col(cols, 6);
    if (!cis || !substance) continue;
    if (nature && nature !== 'SA' && nature !== 'FT' && nature !== 'ST') continue;
    if (!map.has(cis)) map.set(cis, new Set());
    map.get(cis).add(substance);
  }
  return map;
}

function insertAll(db, sql, iterator) {
  const stmt = db.prepare(sql);
  db.run('BEGIN');
  let n = 0;
  for (const row of iterator) {
    stmt.run(row);
    n += 1;
  }
  db.run('COMMIT');
  stmt.free();
  return n;
}

function* tsvRows(filePath) {
  for (const line of readBdpmLines(filePath)) {
    yield line.split('\t');
  }
}

function worstDispo(current, code) {
  const rank = { 1: 4, 2: 3, 3: 2, 4: 1 };
  const a = rank[current] ?? 0;
  const b = rank[code] ?? 0;
  return b > a ? code : current;
}

async function main() {
  for (const f of FILES) {
    await download(f);
  }

  const cisLines = readBdpmLines(path.join(RAW_DIR, 'CIS_bdpm.txt'));
  const compoLines = readBdpmLines(path.join(RAW_DIR, 'CIS_COMPO_bdpm.txt'));
  const compoElig = parseCompoForEligibility(compoLines);

  /** @type {Set<string>} */
  const mitmSet = new Set();
  /** @type {Map<string, string>} */
  const mitmAtc = new Map();
  for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_MITM.txt'))) {
    const cis = col(cols, 0);
    if (!cis) continue;
    mitmSet.add(cis);
    mitmAtc.set(cis, col(cols, 1));
  }

  /** @type {Map<string, string>} code → worst */
  const dispoByCis = new Map();
  for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_CIP_Dispo_Spec.txt'))) {
    const cis = col(cols, 0);
    const code = col(cols, 2);
    if (!cis || !code) continue;
    dispoByCis.set(cis, worstDispo(dispoByCis.get(cis), code));
  }

  /** @type {Set<string>} */
  const infoCis = new Set();
  for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_InfoImportantes.txt'))) {
    const cis = col(cols, 0);
    if (cis) infoCis.add(cis);
  }

  const importedAt = new Date().toISOString().slice(0, 10);
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE arrete_items (
      id TEXT PRIMARY KEY NOT NULL,
      domaine TEXT NOT NULL,
      titre TEXT NOT NULL,
      description TEXT NOT NULL,
      modalite TEXT NOT NULL,
      conditions_json TEXT NOT NULL,
      obligations_json TEXT NOT NULL,
      references_txt TEXT NOT NULL,
      bdpm_keywords_json TEXT NOT NULL
    );
    CREATE TABLE medicaments (
      id TEXT PRIMARY KEY NOT NULL,
      cis TEXT NOT NULL,
      nom TEXT NOT NULL,
      substances TEXT NOT NULL,
      resume TEXT NOT NULL,
      eligible_ide INTEGER NOT NULL,
      niveau_ide TEXT NOT NULL DEFAULT 'non',
      item_arrete_id TEXT,
      conditions_ide TEXT,
      forme TEXT,
      voies TEXT,
      statut_amm TEXT,
      type_procedure TEXT,
      etat_commercialisation TEXT,
      date_amm TEXT,
      statut_bdm TEXT,
      titulaire TEXT,
      surveillance_renforcee INTEGER NOT NULL DEFAULT 0,
      is_mitm INTEGER NOT NULL DEFAULT 0,
      code_atc TEXT,
      dispo_code TEXT,
      dispo_libelle TEXT,
      has_info_importante INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE presentations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cis TEXT NOT NULL,
      cip7 TEXT,
      cip13 TEXT,
      libelle TEXT,
      statut TEXT,
      etat_commercialisation TEXT,
      date_commercialisation TEXT,
      agrement_collectivites TEXT,
      taux_remboursement TEXT,
      prix TEXT,
      indications_remboursement TEXT
    );
    CREATE TABLE compositions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cis TEXT NOT NULL,
      element_pharma TEXT,
      code_substance TEXT,
      substance TEXT,
      dosage TEXT,
      ref_dosage TEXT,
      nature TEXT,
      lien_sa_ft TEXT
    );
    CREATE TABLE conditions_delivrance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cis TEXT NOT NULL,
      condition TEXT NOT NULL
    );
    CREATE TABLE generiques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupe_id TEXT,
      libelle TEXT,
      cis TEXT NOT NULL,
      type_code TEXT,
      type_libelle TEXT,
      tri TEXT
    );
    CREATE TABLE avis_smr (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cis TEXT NOT NULL,
      code_has TEXT,
      motif TEXT,
      date_avis TEXT,
      valeur TEXT,
      libelle TEXT,
      url TEXT
    );
    CREATE TABLE avis_asmr (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cis TEXT NOT NULL,
      code_has TEXT,
      motif TEXT,
      date_avis TEXT,
      valeur TEXT,
      libelle TEXT,
      url TEXT
    );
    CREATE TABLE has_liens (
      code_has TEXT PRIMARY KEY NOT NULL,
      url TEXT NOT NULL
    );
    CREATE TABLE ruptures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cis TEXT NOT NULL,
      cip TEXT,
      code_statut TEXT,
      libelle_statut TEXT,
      date_debut TEXT,
      date_maj TEXT,
      date_remise TEXT,
      url TEXT
    );
    CREATE TABLE mitm (
      cis TEXT PRIMARY KEY NOT NULL,
      code_atc TEXT,
      denomination TEXT,
      url TEXT
    );
    CREATE TABLE infos_importantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cis TEXT NOT NULL,
      date_debut TEXT,
      date_fin TEXT,
      texte TEXT
    );

    CREATE INDEX idx_arrete_domaine ON arrete_items(domaine);
    CREATE INDEX idx_med_nom ON medicaments(nom);
    CREATE INDEX idx_med_substances ON medicaments(substances);
    CREATE INDEX idx_med_eligible ON medicaments(eligible_ide);
    CREATE INDEX idx_med_niveau ON medicaments(niveau_ide);
    CREATE INDEX idx_med_cis ON medicaments(cis);
    CREATE INDEX idx_pres_cis ON presentations(cis);
    CREATE INDEX idx_compo_cis ON compositions(cis);
    CREATE INDEX idx_cpd_cis ON conditions_delivrance(cis);
    CREATE INDEX idx_gen_cis ON generiques(cis);
    CREATE INDEX idx_smr_cis ON avis_smr(cis);
    CREATE INDEX idx_asmr_cis ON avis_asmr(cis);
    CREATE INDEX idx_rup_cis ON ruptures(cis);
    CREATE INDEX idx_info_cis ON infos_importantes(cis);
  `);

  const insertArrete = db.prepare(`
    INSERT INTO arrete_items
      (id, domaine, titre, description, modalite, conditions_json, obligations_json, references_txt, bdpm_keywords_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of ARRETE_ITEMS) {
    insertArrete.run([
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
  insertArrete.free();

  let eligibleCount = 0;
  let eligibleOui = 0;
  let eligibleConditions = 0;
  let commercialized = 0;

  const insertMed = db.prepare(`
    INSERT INTO medicaments (
      id, cis, nom, substances, resume, eligible_ide, niveau_ide, item_arrete_id, conditions_ide,
      forme, voies, statut_amm, type_procedure, etat_commercialisation, date_amm,
      statut_bdm, titulaire, surveillance_renforcee, is_mitm, code_atc,
      dispo_code, dispo_libelle, has_info_importante
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.run('BEGIN');
  for (const line of cisLines) {
    const cols = line.split('\t');
    const cis = col(cols, 0);
    const nom = col(cols, 1);
    const forme = col(cols, 2);
    const voies = col(cols, 3);
    const statutAmm = col(cols, 4);
    const typeProc = col(cols, 5);
    const etat = col(cols, 6);
    const dateAmm = col(cols, 7);
    const statutBdm = col(cols, 8);
    const titulaire = col(cols, 10);
    const surv = col(cols, 11);
    if (!cis || !nom) continue;

    if (/commercialis/i.test(etat)) commercialized += 1;

    const substances = [...(compoElig.get(cis) || [])].sort();
    const substancesStr = substances.join(' | ') || '—';
    const verdict = evaluerEligibilite({ nom, substancesBrutes: substances, forme, voies });
    if (verdict) {
      eligibleCount += 1;
      if (verdict.niveau === NIVEAU.OUI) eligibleOui += 1;
      else eligibleConditions += 1;
    }

    const dispoCode = dispoByCis.get(cis) || '';
    const dispoLib = DISPO_LIBELLE[dispoCode] || '';
    const isMitm = mitmSet.has(cis) ? 1 : 0;
    const hasInfo = infoCis.has(cis) ? 1 : 0;
    const surveillance = /^oui$/i.test(surv) ? 1 : 0;

    const resume = [
      forme && `Forme : ${forme}`,
      voies && `Voie(s) : ${voies}`,
      etat && `État : ${etat}`,
      titulaire && `Titulaire : ${titulaire}`,
      dispoLib && `Disponibilité : ${dispoLib}`,
      isMitm && 'MITM',
      'Source : BDPM (base-donnees-publique.medicaments.gouv.fr)',
    ]
      .filter(Boolean)
      .join(' · ');

    insertMed.run([
      `cis-${cis}`,
      cis,
      nom,
      substancesStr,
      resume,
      verdict ? 1 : 0,
      verdict ? verdict.niveau : NIVEAU.NON,
      verdict ? verdict.itemArreteId : null,
      verdict ? verdict.conditionsIde : null,
      forme,
      voies,
      statutAmm,
      typeProc,
      etat,
      dateAmm,
      statutBdm,
      titulaire,
      surveillance,
      isMitm,
      mitmAtc.get(cis) || '',
      dispoCode || null,
      dispoLib || null,
      hasInfo,
    ]);
  }
  db.run('COMMIT');
  insertMed.free();
  console.log(
    `  spécialités : ${cisLines.length} (arrêté : ${eligibleOui} autorisées, ${eligibleConditions} sous conditions)`,
  );

  const nPres = insertAll(
    db,
    `INSERT INTO presentations
      (cis, cip7, cip13, libelle, statut, etat_commercialisation, date_commercialisation,
       agrement_collectivites, taux_remboursement, prix, indications_remboursement)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_CIP_bdpm.txt'))) {
        const cis = col(cols, 0);
        if (!cis) continue;
        yield [
          cis,
          col(cols, 1),
          col(cols, 6),
          col(cols, 2),
          col(cols, 3),
          col(cols, 4),
          col(cols, 5),
          col(cols, 7),
          col(cols, 8),
          col(cols, 9),
          col(cols, 10),
        ];
      }
    })(),
  );
  console.log(`  présentations : ${nPres}`);

  const nCompo = insertAll(
    db,
    `INSERT INTO compositions
      (cis, element_pharma, code_substance, substance, dosage, ref_dosage, nature, lien_sa_ft)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_COMPO_bdpm.txt'))) {
        const cis = col(cols, 0);
        if (!cis) continue;
        yield [
          cis,
          col(cols, 1),
          col(cols, 2),
          col(cols, 3),
          col(cols, 4),
          col(cols, 5),
          col(cols, 6),
          col(cols, 7),
        ];
      }
    })(),
  );
  console.log(`  compositions : ${nCompo}`);

  const hasLiens = new Map();
  const nLiens = insertAll(
    db,
    `INSERT OR REPLACE INTO has_liens (code_has, url) VALUES (?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'HAS_LiensPageCT_bdpm.txt'))) {
        const code = col(cols, 0);
        const url = col(cols, 1);
        if (!code || !url) continue;
        hasLiens.set(code, url);
        yield [code, url];
      }
    })(),
  );
  console.log(`  liens HAS : ${nLiens}`);

  const nSmr = insertAll(
    db,
    `INSERT INTO avis_smr (cis, code_has, motif, date_avis, valeur, libelle, url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_HAS_SMR_bdpm.txt'))) {
        const cis = col(cols, 0);
        if (!cis) continue;
        const codeHas = col(cols, 1);
        yield [
          cis,
          codeHas,
          col(cols, 2),
          col(cols, 3),
          col(cols, 4),
          col(cols, 5),
          hasLiens.get(codeHas) || '',
        ];
      }
    })(),
  );
  console.log(`  avis SMR : ${nSmr}`);

  const nAsmr = insertAll(
    db,
    `INSERT INTO avis_asmr (cis, code_has, motif, date_avis, valeur, libelle, url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_HAS_ASMR_bdpm.txt'))) {
        const cis = col(cols, 0);
        if (!cis) continue;
        const codeHas = col(cols, 1);
        yield [
          cis,
          codeHas,
          col(cols, 2),
          col(cols, 3),
          col(cols, 4),
          col(cols, 5),
          hasLiens.get(codeHas) || '',
        ];
      }
    })(),
  );
  console.log(`  avis ASMR : ${nAsmr}`);

  const nGen = insertAll(
    db,
    `INSERT INTO generiques (groupe_id, libelle, cis, type_code, type_libelle, tri)
     VALUES (?, ?, ?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_GENER_bdpm.txt'))) {
        const cis = col(cols, 2);
        if (!cis) continue;
        const typeCode = col(cols, 3);
        yield [
          col(cols, 0),
          col(cols, 1),
          cis,
          typeCode,
          GENER_TYPE[typeCode] || typeCode,
          col(cols, 4),
        ];
      }
    })(),
  );
  console.log(`  génériques : ${nGen}`);

  const nCpd = insertAll(
    db,
    `INSERT INTO conditions_delivrance (cis, condition) VALUES (?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_CPD_bdpm.txt'))) {
        const cis = col(cols, 0);
        const cond = col(cols, 1);
        if (!cis || !cond) continue;
        yield [cis, cond];
      }
    })(),
  );
  console.log(`  conditions prescription/délivrance : ${nCpd}`);

  const nRup = insertAll(
    db,
    `INSERT INTO ruptures
      (cis, cip, code_statut, libelle_statut, date_debut, date_maj, date_remise, url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_CIP_Dispo_Spec.txt'))) {
        const cis = col(cols, 0);
        if (!cis) continue;
        let cip, code, libelle, debut, maj, remise, url;
        if (cols.length >= 8) {
          cip = col(cols, 1);
          code = col(cols, 2);
          libelle = col(cols, 3);
          debut = col(cols, 4);
          maj = col(cols, 5);
          remise = col(cols, 6);
          url = col(cols, 7);
        } else {
          cip = col(cols, 1);
          code = col(cols, 2);
          libelle = DISPO_LIBELLE[code] || '';
          debut = col(cols, 3);
          maj = col(cols, 4);
          remise = col(cols, 5);
          url = col(cols, 6);
        }
        yield [cis, cip, code, libelle || DISPO_LIBELLE[code] || code, debut, maj, remise, url];
      }
    })(),
  );
  console.log(`  ruptures / disponibilités : ${nRup}`);

  const nMitm = insertAll(
    db,
    `INSERT OR REPLACE INTO mitm (cis, code_atc, denomination, url) VALUES (?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_MITM.txt'))) {
        const cis = col(cols, 0);
        if (!cis) continue;
        yield [cis, col(cols, 1), col(cols, 2), col(cols, 3)];
      }
    })(),
  );
  console.log(`  MITM : ${nMitm}`);

  const nInfo = insertAll(
    db,
    `INSERT INTO infos_importantes (cis, date_debut, date_fin, texte) VALUES (?, ?, ?, ?)`,
    (function* () {
      for (const cols of tsvRows(path.join(RAW_DIR, 'CIS_InfoImportantes.txt'))) {
        const cis = col(cols, 0);
        if (!cis) continue;
        yield [cis, col(cols, 1), col(cols, 2), col(cols, 3)];
      }
    })(),
  );
  console.log(`  informations importantes : ${nInfo}`);

  const counts = {
    specialites: cisLines.length,
    presentations: nPres,
    compositions: nCompo,
    avisSmr: nSmr,
    avisAsmr: nAsmr,
    liensHas: nLiens,
    generiques: nGen,
    conditionsDelivrance: nCpd,
    ruptures: nRup,
    mitm: nMitm,
    infosImportantes: nInfo,
  };

  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', ['seed_version', '2026-06-26']);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'arrete_catalog_version',
    CATALOG_VERSION,
  ]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'bdpm_imported_at',
    `${importedAt} (BDPM officielle, 11 fichiers)`,
  ]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', ['arrete_nor', 'SFHH2617311A']);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'bdpm_source',
    'https://base-donnees-publique.medicaments.gouv.fr/telechargement',
  ]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', ['bdpm_count', String(cisLines.length)]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'bdpm_eligible_count',
    String(eligibleCount),
  ]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'bdpm_eligible_oui_count',
    String(eligibleOui),
  ]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'bdpm_eligible_conditions_count',
    String(eligibleConditions),
  ]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'bdpm_files',
    FILES.map((f) => f.local).join(', '),
  ]);
  db.run('INSERT INTO meta (key, value) VALUES (?, ?)', [
    'bdpm_counts',
    JSON.stringify(counts),
  ]);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outDb = path.join(OUT_DIR, 'inficheck.db');
  const data = db.export();
  fs.writeFileSync(outDb, Buffer.from(data));
  db.close();

  const meta = {
    importedAt,
    cisCount: cisLines.length,
    commercializedApprox: commercialized,
    eligibleIdeApprox: eligibleCount,
    eligibleIdeOui: eligibleOui,
    eligibleIdeConditions: eligibleConditions,
    source: 'https://base-donnees-publique.medicaments.gouv.fr/telechargement',
    files: FILES.map((f) => f.local),
    counts,
    dbFile: 'assets/bdpm/inficheck.db',
    catalogVersion: CATALOG_VERSION,
    licenseNote:
      'Licence Ouverte — citer BDPM et la date de mise à jour. Ne pas dénaturer les données.',
  };
  fs.writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  console.log('\nOK');
  console.log(`  Spécialités : ${cisLines.length}`);
  console.log(`  Rattachées à l’arrêté : ${eligibleOui} autorisées, ${eligibleConditions} sous conditions`);
  console.log(`  DB : ${outDb} (${fs.statSync(outDb).size} octets)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
