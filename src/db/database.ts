import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type {
  ArreteItem,
  BdpmAvisHas,
  BdpmComposition,
  BdpmGenerique,
  BdpmInfoImportante,
  BdpmMedicament,
  BdpmMedicamentDetail,
  BdpmNomCommercialGroupe,
  BdpmPresentation,
  BdpmRupture,
  DomaineId,
  Modalite,
  NiveauIde,
} from '../types';
import { extractNomCommercial, parseTauxAgg } from '../utils/medicament';

const DB_NAME = 'inficheck.db';
const VERSION_FILE = 'inficheck.content-version';
/** Ancien fichier de version : migré une fois vers VERSION_FILE. */
const LEGACY_VERSION_FILE = 'inficheck.bdpm-version';

const BUNDLED_DB = require('../../assets/bdpm/inficheck.db');
const BUNDLED_META = require('../../assets/bdpm/meta.json') as {
  importedAt: string;
  cisCount: number;
  eligibleIdeApprox: number;
  catalogVersion?: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let openDb: SQLite.SQLiteDatabase | null = null;

function bundledContentVersionKey(): string {
  return `${BUNDLED_META.importedAt}+${BUNDLED_META.catalogVersion ?? '0'}`;
}

export function getBundledContentMeta() {
  return {
    contentVersion: bundledContentVersionKey(),
    importedAt: BUNDLED_META.importedAt,
    catalogVersion: BUNDLED_META.catalogVersion ?? '0',
    cisCount: BUNDLED_META.cisCount,
    eligibleIdeApprox: BUNDLED_META.eligibleIdeApprox,
  };
}

function sqliteDir(): string {
  const dir = SQLite.defaultDatabaseDirectory;
  if (!dir) {
    throw new Error('Répertoire SQLite indisponible sur cette plateforme');
  }
  return dir;
}

export function getNativeDatabasePath(): string {
  return `${sqliteDir()}/${DB_NAME}`;
}

export function getNativeDownloadPath(fileName: string): string {
  return `${sqliteDir()}/${fileName}`;
}

function versionFilePath(): string {
  return `${sqliteDir()}/${VERSION_FILE}`;
}

async function loadBundledDbBytes(): Promise<Uint8Array> {
  const asset = Asset.fromModule(BUNDLED_DB);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    throw new Error('Impossible de résoudre la base BDPM bundlée');
  }
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Échec du chargement BDPM (${res.status})`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

export async function readInstalledContentVersion(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return bundledContentVersionKey();
  }
  const path = versionFilePath();
  const legacy = `${sqliteDir()}/${LEGACY_VERSION_FILE}`;
  const [info, legacyInfo] = await Promise.all([
    FileSystem.getInfoAsync(path),
    FileSystem.getInfoAsync(legacy),
  ]);
  if (info.exists) {
    const value = (await FileSystem.readAsStringAsync(path)).trim();
    return value || null;
  }
  if (legacyInfo.exists) {
    const value = (await FileSystem.readAsStringAsync(legacy)).trim();
    if (value) {
      await FileSystem.writeAsStringAsync(path, value).catch(() => undefined);
      return value;
    }
  }
  return null;
}

async function writeInstalledContentVersion(version: string) {
  await FileSystem.writeAsStringAsync(versionFilePath(), version);
}

async function copyBundledDatabaseTo(target: string) {
  const asset = Asset.fromModule(BUNDLED_DB);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Impossible de résoudre la base BDPM bundlée');
  }
  await FileSystem.copyAsync({ from: asset.localUri, to: target });
}

/**
 * Installe la base bundlée si absente, ou si le paquet embarqué est plus récent
 * que la base locale (OTA ou ancienne copie). Ne rétrograde jamais un contenu OTA
 * plus neuf qu'un build d'app plus ancien.
 */
async function ensureBundledDatabaseNative() {
  await FileSystem.makeDirectoryAsync(sqliteDir(), { intermediates: true }).catch(() => undefined);

  const target = getNativeDatabasePath();
  const bundled = bundledContentVersionKey();
  const installed = await readInstalledContentVersion();
  const dbInfo = await FileSystem.getInfoAsync(target);

  const needsCopy =
    !dbInfo.exists || !installed || (installed !== bundled && bundled > installed);

  if (!needsCopy) return;

  await copyBundledDatabaseTo(target);
  await writeInstalledContentVersion(bundled);
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      // Web : pas de FileSystem natif → désérialisation en mémoire
      if (Platform.OS === 'web') {
        const bytes = await loadBundledDbBytes();
        const db = await SQLite.deserializeDatabaseAsync(bytes);
        openDb = db;
        return db;
      }
      await ensureBundledDatabaseNative();
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      openDb = db;
      return db;
    })();
  }
  return dbPromise;
}

export async function initDatabase() {
  const db = await getDb();
  const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM medicaments');
  if (!count || count.c < 1000) {
    throw new Error('Base médicaments invalide ou incomplète');
  }
}

/** Ferme la connexion courante — requis avant de remplacer le fichier SQLite. */
export async function closeDatabase(): Promise<void> {
  const pending = dbPromise;
  dbPromise = null;
  const db = openDb;
  openDb = null;
  if (db) {
    await db.closeAsync().catch(() => undefined);
    return;
  }
  if (pending) {
    const opened = await pending.catch(() => null);
    await opened?.closeAsync().catch(() => undefined);
  }
}

/**
 * Remplace la base native par un fichier déjà validé, puis rouvre la connexion.
 * `fromUri` doit pointer vers un SQLite hors du fichier cible (téléchargement temporaire).
 * On écrase sans supprimer d'abord : si la copie échoue, l'ancienne base reste intacte.
 */
export async function installNativeDatabaseFromFile(
  fromUri: string,
  contentVersion: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Les mises à jour de contenu ne sont pas disponibles sur le web');
  }

  await closeDatabase();
  await FileSystem.copyAsync({ from: fromUri, to: getNativeDatabasePath() });
  await writeInstalledContentVersion(contentVersion);
  await FileSystem.deleteAsync(fromUri, { idempotent: true }).catch(() => undefined);
  await initDatabase();
}

/** Ouvre un fichier SQLite voisin pour validation sans toucher à la base active. */
export async function openTemporaryDatabase(fileName: string): Promise<SQLite.SQLiteDatabase> {
  return SQLite.openDatabaseAsync(fileName);
}

type ArreteRow = {
  id: string;
  domaine: DomaineId;
  titre: string;
  description: string;
  modalite: Modalite;
  conditions_json: string;
  obligations_json: string;
  references_txt: string;
  bdpm_keywords_json: string;
};

function mapArrete(row: ArreteRow): ArreteItem {
  return {
    id: row.id,
    domaine: row.domaine,
    titre: row.titre,
    description: row.description,
    modalite: row.modalite,
    conditions: JSON.parse(row.conditions_json) as string[],
    obligations: JSON.parse(row.obligations_json) as string[],
    references: row.references_txt,
    bdpmKeywords: JSON.parse(row.bdpm_keywords_json) as string[],
  };
}

/** Colonnes médicament + taux BDPM agrégé (présentations). */
const MED_SELECT = `
  m.*,
  (
    SELECT GROUP_CONCAT(DISTINCT TRIM(p.taux_remboursement))
    FROM presentations p
    WHERE p.cis = m.cis
      AND TRIM(IFNULL(p.taux_remboursement, '')) != ''
  ) AS taux_remboursement_agg
`;

/** Les spécialités effectivement commercialisées passent devant. */
const TRI_COMMERCIALISEES = `
  CASE WHEN m.etat_commercialisation LIKE 'Commercialis%' THEN 0 ELSE 1 END
`;

type MedRow = {
  id: string;
  cis: string;
  nom: string;
  substances: string;
  resume: string;
  eligible_ide: number;
  niveau_ide: string | null;
  item_arrete_id: string | null;
  conditions_ide: string | null;
  taux_remboursement_agg?: string | null;
  forme?: string | null;
  voies?: string | null;
  statut_amm?: string | null;
  type_procedure?: string | null;
  etat_commercialisation?: string | null;
  date_amm?: string | null;
  statut_bdm?: string | null;
  titulaire?: string | null;
  surveillance_renforcee?: number | null;
  is_mitm?: number | null;
  code_atc?: string | null;
  dispo_code?: string | null;
  dispo_libelle?: string | null;
  has_info_importante?: number | null;
};

function mapMed(row: MedRow): BdpmMedicament {
  const remb = parseTauxAgg(row.taux_remboursement_agg);
  return {
    id: row.id,
    cis: row.cis,
    nom: row.nom,
    nomCommercial: extractNomCommercial(row.nom),
    substances: row.substances,
    resume: row.resume,
    eligibleIde: row.eligible_ide ? 1 : 0,
    niveauIde: row.niveau_ide === 'oui' || row.niveau_ide === 'conditions' ? row.niveau_ide : 'non',
    remboursable: remb.remboursable,
    tauxRemboursement: remb.tauxLabel,
    itemArreteId: row.item_arrete_id,
    conditionsIde: row.conditions_ide,
    forme: row.forme,
    voies: row.voies,
    statutAmm: row.statut_amm,
    typeProcedure: row.type_procedure,
    etatCommercialisation: row.etat_commercialisation,
    dateAmm: row.date_amm,
    statutBdm: row.statut_bdm,
    titulaire: row.titulaire,
    surveillanceRenforcee: Boolean(row.surveillance_renforcee),
    isMitm: Boolean(row.is_mitm),
    codeAtc: row.code_atc,
    dispoCode: row.dispo_code,
    dispoLibelle: row.dispo_libelle,
    hasInfoImportante: Boolean(row.has_info_importante),
  };
}

function ficheUrl(cis: string) {
  return `https://base-donnees-publique.medicaments.gouv.fr/extrait.php?specid=${cis}`;
}

export async function getItemsByDomaine(domaine: DomaineId): Promise<ArreteItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ArreteRow>(
    'SELECT * FROM arrete_items WHERE domaine = ? ORDER BY titre',
    [domaine],
  );
  return rows.map(mapArrete);
}

export async function getItemById(id: string): Promise<ArreteItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ArreteRow>('SELECT * FROM arrete_items WHERE id = ?', [id]);
  return row ? mapArrete(row) : null;
}

export async function searchArrete(query: string): Promise<ArreteItem[]> {
  const db = await getDb();
  const q = `%${query.trim()}%`;
  const rows = await db.getAllAsync<ArreteRow>(
    `SELECT * FROM arrete_items
     WHERE titre LIKE ? OR description LIKE ? OR conditions_json LIKE ? OR obligations_json LIKE ?
     ORDER BY titre LIMIT 50`,
    [q, q, q, q],
  );
  return rows.map(mapArrete);
}

/** `null` = tous les niveaux. `liste` = oui + sous conditions. Le niveau `non` couvre aussi les lignes sans valeur. */
function niveauClause(niveau: NiveauIde | 'liste' | null): string {
  if (!niveau) return '';
  if (niveau === 'liste') {
    return `AND m.niveau_ide IN ('oui', 'conditions')`;
  }
  if (niveau === 'non') {
    return `AND (m.niveau_ide IS NULL OR m.niveau_ide NOT IN ('oui', 'conditions'))`;
  }
  return `AND m.niveau_ide = '${niveau}'`;
}

export async function searchMedicaments(
  query: string,
  niveau: NiveauIde | 'liste' | null = null,
): Promise<BdpmMedicament[]> {
  const db = await getDb();
  const q = `%${query.trim()}%`;
  const rows = await db.getAllAsync<MedRow>(
    `SELECT ${MED_SELECT}
     FROM medicaments m
     WHERE (m.nom LIKE ? OR m.substances LIKE ? OR m.resume LIKE ?)
       ${niveauClause(niveau)}
     ORDER BY m.eligible_ide DESC, ${TRI_COMMERCIALISEES}, m.nom LIMIT 80`,
    [q, q, q],
  );
  return rows.map(mapMed);
}

export async function listMedicaments(
  limit = 80,
  niveau: NiveauIde | 'liste' | null = null,
): Promise<BdpmMedicament[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MedRow>(
    `SELECT ${MED_SELECT}
     FROM medicaments m
     WHERE 1 = 1 ${niveauClause(niveau)}
     ORDER BY m.eligible_ide DESC, ${TRI_COMMERCIALISEES}, m.nom
     LIMIT ?`,
    [limit],
  );
  return rows.map(mapMed);
}

export async function getMedicamentById(id: string): Promise<BdpmMedicament | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedRow>(
    `SELECT ${MED_SELECT} FROM medicaments m WHERE m.id = ?`,
    [id],
  );
  return row ? mapMed(row) : null;
}

export async function getMedicamentDetail(id: string): Promise<BdpmMedicamentDetail | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedRow>(
    `SELECT ${MED_SELECT} FROM medicaments m WHERE m.id = ?`,
    [id],
  );
  if (!row) return null;
  const med = mapMed(row);
  const cis = med.cis;

  const [
    presentations,
    compositions,
    cpd,
    generiques,
    avisSmr,
    avisAsmr,
    ruptures,
    infos,
    groupeNoms,
  ] = await Promise.all([
    db.getAllAsync<{
      cip7: string;
      cip13: string;
      libelle: string;
      statut: string;
      etat_commercialisation: string;
      date_commercialisation: string;
      agrement_collectivites: string;
      taux_remboursement: string;
      prix: string;
      indications_remboursement: string;
    }>(
      `SELECT cip7, cip13, libelle, statut, etat_commercialisation, date_commercialisation,
              agrement_collectivites, taux_remboursement, prix, indications_remboursement
       FROM presentations WHERE cis = ? ORDER BY libelle`,
      [cis],
    ),
    db.getAllAsync<{
      element_pharma: string;
      code_substance: string;
      substance: string;
      dosage: string;
      ref_dosage: string;
      nature: string;
    }>(
      `SELECT element_pharma, code_substance, substance, dosage, ref_dosage, nature
       FROM compositions WHERE cis = ? ORDER BY nature, substance`,
      [cis],
    ),
    db.getAllAsync<{ condition: string }>(
      'SELECT condition FROM conditions_delivrance WHERE cis = ?',
      [cis],
    ),
    db.getAllAsync<{ groupe_id: string; libelle: string; type_libelle: string }>(
      'SELECT groupe_id, libelle, type_libelle FROM generiques WHERE cis = ?',
      [cis],
    ),
    db.getAllAsync<{
      code_has: string;
      motif: string;
      date_avis: string;
      valeur: string;
      libelle: string;
      url: string;
    }>(
      `SELECT code_has, motif, date_avis, valeur, libelle, url
       FROM avis_smr WHERE cis = ? ORDER BY date_avis DESC LIMIT 5`,
      [cis],
    ),
    db.getAllAsync<{
      code_has: string;
      motif: string;
      date_avis: string;
      valeur: string;
      libelle: string;
      url: string;
    }>(
      `SELECT code_has, motif, date_avis, valeur, libelle, url
       FROM avis_asmr WHERE cis = ? ORDER BY date_avis DESC LIMIT 5`,
      [cis],
    ),
    db.getAllAsync<{
      cip: string;
      code_statut: string;
      libelle_statut: string;
      date_debut: string;
      date_maj: string;
      date_remise: string;
      url: string;
    }>(
      `SELECT cip, code_statut, libelle_statut, date_debut, date_maj, date_remise, url
       FROM ruptures WHERE cis = ? ORDER BY date_maj DESC`,
      [cis],
    ),
    db.getAllAsync<{ date_debut: string; date_fin: string; texte: string }>(
      `SELECT date_debut, date_fin, texte FROM infos_importantes WHERE cis = ?`,
      [cis],
    ),
    db.getAllAsync<{ cis: string; nom: string; type_libelle: string }>(
      `SELECT DISTINCT m.cis, m.nom, g.type_libelle
       FROM generiques g
       INNER JOIN medicaments m ON m.cis = g.cis
       WHERE g.groupe_id IN (SELECT groupe_id FROM generiques WHERE cis = ?)
       ORDER BY
         CASE g.type_code WHEN '0' THEN 0 WHEN '5' THEN 1 ELSE 2 END,
         m.nom
       LIMIT 40`,
      [cis],
    ),
  ]);

  const mapAvis = (a: {
    code_has: string;
    motif: string;
    date_avis: string;
    valeur: string;
    libelle: string;
    url: string;
  }): BdpmAvisHas => ({
    codeHas: a.code_has,
    motif: a.motif,
    dateAvis: a.date_avis,
    valeur: a.valeur,
    libelle: a.libelle,
    url: a.url,
  });

  return {
    ...med,
    presentations: presentations.map(
      (p): BdpmPresentation => ({
        cip7: p.cip7,
        cip13: p.cip13,
        libelle: p.libelle,
        statut: p.statut,
        etatCommercialisation: p.etat_commercialisation,
        dateCommercialisation: p.date_commercialisation,
        agrementCollectivites: p.agrement_collectivites,
        tauxRemboursement: p.taux_remboursement,
        prix: p.prix,
        indicationsRemboursement: p.indications_remboursement,
      }),
    ),
    compositions: compositions.map(
      (c): BdpmComposition => ({
        elementPharma: c.element_pharma,
        codeSubstance: c.code_substance,
        substance: c.substance,
        dosage: c.dosage,
        refDosage: c.ref_dosage,
        nature: c.nature,
      }),
    ),
    conditionsDelivrance: cpd.map((c) => c.condition),
    generiques: generiques.map(
      (g): BdpmGenerique => ({
        groupeId: g.groupe_id,
        libelle: g.libelle,
        typeLibelle: g.type_libelle,
      }),
    ),
    avisSmr: avisSmr.map(mapAvis),
    avisAsmr: avisAsmr.map(mapAvis),
    ruptures: ruptures.map(
      (r): BdpmRupture => ({
        cip: r.cip,
        codeStatut: r.code_statut,
        libelleStatut: r.libelle_statut,
        dateDebut: r.date_debut,
        dateMaj: r.date_maj,
        dateRemise: r.date_remise,
        url: r.url,
      }),
    ),
    infosImportantes: infos.map(
      (i): BdpmInfoImportante => ({
        dateDebut: i.date_debut,
        dateFin: i.date_fin,
        texte: i.texte,
      }),
    ),
    nomsCommerciauxGroupe: (() => {
      const seen = new Set<string>();
      const out: BdpmNomCommercialGroupe[] = [];
      for (const g of groupeNoms) {
        const nomCommercial = extractNomCommercial(g.nom);
        const key = nomCommercial.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          cis: g.cis,
          nom: g.nom,
          nomCommercial,
          typeLibelle: g.type_libelle,
        });
      }
      return out;
    })(),
    ficheBdpmUrl: ficheUrl(cis),
  };
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [
    key,
  ]);
  return row?.value ?? null;
}

/** Infos affichées dans l'UI : ce que l'appareil a réellement chargé. */
export async function getLocalContentInfo(): Promise<{
  contentVersion: string;
  importedAt: string | null;
  catalogVersion: string | null;
  cisCount: number | null;
}> {
  const [contentVersion, importedAt, catalogVersion, cisCount] = await Promise.all([
    readInstalledContentVersion(),
    getMeta('bdpm_imported_at'),
    getMeta('arrete_catalog_version'),
    getMeta('bdpm_count'),
  ]);
  return {
    contentVersion: contentVersion ?? getBundledContentMeta().contentVersion,
    importedAt,
    catalogVersion,
    cisCount: cisCount ? Number(cisCount) : null,
  };
}

export async function getMedicamentsByItemId(
  itemArreteId: string,
  limit = 40,
): Promise<BdpmMedicament[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MedRow>(
    `SELECT ${MED_SELECT}
     FROM medicaments m
     WHERE m.item_arrete_id = ? AND m.eligible_ide = 1
     ORDER BY ${TRI_COMMERCIALISEES}, m.nom
     LIMIT ?`,
    [itemArreteId, limit],
  );
  return rows.map(mapMed);
}

export async function countMedicamentsByItemId(itemArreteId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM medicaments
     WHERE item_arrete_id = ? AND eligible_ide = 1`,
    [itemArreteId],
  );
  return row?.c ?? 0;
}

export async function getMedicamentsByDomaine(
  domaine: DomaineId,
  limit = 60,
): Promise<BdpmMedicament[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MedRow>(
    `SELECT ${MED_SELECT}
     FROM medicaments m
     INNER JOIN arrete_items a ON a.id = m.item_arrete_id
     WHERE a.domaine = ? AND m.eligible_ide = 1
     ORDER BY ${TRI_COMMERCIALISEES}, m.nom
     LIMIT ?`,
    [domaine, limit],
  );
  return rows.map(mapMed);
}

export async function getMedicationStats(): Promise<{
  total: number;
  eligible: number;
  autorisees: number;
  sousConditions: number;
}> {
  const db = await getDb();
  const total = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM medicaments');
  const row = await db.getFirstAsync<{ eligible: number; oui: number; conditions: number }>(
    `SELECT
       COUNT(*) AS eligible,
       SUM(CASE WHEN niveau_ide = 'oui' THEN 1 ELSE 0 END) AS oui,
       SUM(CASE WHEN niveau_ide = 'conditions' THEN 1 ELSE 0 END) AS conditions
     FROM medicaments WHERE eligible_ide = 1`,
  );
  return {
    total: total?.c ?? 0,
    eligible: row?.eligible ?? 0,
    autorisees: row?.oui ?? 0,
    sousConditions: row?.conditions ?? 0,
  };
}
