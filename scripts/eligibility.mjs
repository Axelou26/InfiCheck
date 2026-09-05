/**
 * Croisement arrêté du 26 juin 2026 (SFHH2617311A) ↔ spécialités BDPM.
 *
 * Principe : liste blanche stricte. Pour qu'une spécialité soit rattachée à un item
 * de l'arrêté, il faut que TOUTES ses substances actives figurent dans la liste
 * blanche de la règle et que TOUTES ses voies d'administration soient autorisées.
 * Une seule substance ou voie inconnue écarte la spécialité.
 *
 * Un faux négatif (spécialité éligible non signalée) est acceptable : l'IDE se
 * reporte au texte. Un faux positif (produit hors liste affiché comme prescriptible)
 * ne l'est pas.
 */

/** Niveaux d'éligibilité stockés en base (colonne niveau_ide). */
export const NIVEAU = {
  OUI: 'oui',
  CONDITIONS: 'conditions',
  NON: 'non',
};

export function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sels et formes chimiques qui habillent le nom d'une substance BDPM. */
const PREFIXES_SEL =
  /^(?:chlorhydrate|acetate|sulfate|phosphate|bitartrate|tartrate|resinate|digluconate|gluconate|maleate|valerate|citrate|mesilate|besilate|succinate|fumarate|solution|poudre|diisetionate|diisethionate|etilsulfate)\s+(?:de\s+|du\s+|d')/;
const SUFFIXES_FORME =
  /\s*(anhydre|hydrate|hydratee?|monohydratee?|hemihydratee?|dihydratee?|trihydratee?|sesquihydratee?|disodique|base|polacrilex|betadex-clathrate|-betadex|clathrate|pour preparations homeopathiques)\s*$/;

/** Dénominations BDPM que la canonicalisation ne réduit pas seule. */
const ALIAS = new Map(
  Object.entries({
    acetylsalicylique: 'acide acetylsalicylique',
    'acetylsalicylate de dl-lysine': 'acide acetylsalicylique',
    'dl-lysine': 'acide acetylsalicylique',
    ascorbique: 'acide ascorbique',
    'peroxyde de hydrogene': "peroxyde d'hydrogene",
    ethanol: 'alcool',
    'alcool isopropylique': 'alcool',
    isopropylique: 'alcool',
    'alcool propylique': 'alcool',
    'chlorure de benzalkonium': 'benzalkonium',
    'chlore actif': 'hypochlorite de sodium',
    'catioresine carboxylate de nicotine': 'nicotine',
  }),
);

/**
 * Réduit une dénomination de substance BDPM à son principe actif.
 * « PHOSPHATE DE CODÉINE HÉMIHYDRATÉ » → « codeine »
 * « SODIUM (HYPOCHLORITE DE), SOLUTION D' » → « hypochlorite de sodium »
 */
export function canonicalSubstance(raw) {
  let s = normalize(raw);

  // Forme inversée « principe (sel de) » → « sel de principe ».
  s = s.replace(/([^(]+?)\s*\(([^)]*?)\s+(?:de|d'|du)\s*\)/g, '$2 de $1');
  s = s.replace(/\([^)]*\)/g, ' ');

  s = s.replace(/,?\s*solution(\s+concentree)?(\s+(?:de|d'|du))?\b/g, ' ');
  s = s.replace(/,?\s*a\s+(x|\d+([.,]\d+)?)\s*(pour cent|%)/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  let previous;
  do {
    previous = s;
    s = s
      .replace(/^(?:de\s+|du\s+|d')/, '')
      .replace(PREFIXES_SEL, '')
      .replace(SUFFIXES_FORME, '')
      .trim();
  } while (s !== previous && s.length);

  s = s
    .replace(/[,;.]+$/, '')
    .replace(/\s+(de|d'|du|a)$/, '')
    .trim();

  return ALIAS.get(s) ?? s;
}

/** Doses exprimées en mg dans la dénomination de la spécialité. */
export function dosesMg(nom) {
  const out = [];
  const re = /(\d+(?:[.,]\d+)?)\s*(microgrammes?|mcg|µg|ug|mg|g)\b/gi;
  let m;
  while ((m = re.exec(String(nom))) !== null) {
    const value = Number(m[1].replace(',', '.'));
    if (!Number.isFinite(value)) continue;
    const unit = m[2].toLowerCase();
    if (unit === 'g') out.push(value * 1000);
    else if (unit === 'mg') out.push(value);
    else out.push(value / 1000);
  }
  return out;
}

export function splitVoies(voies) {
  return normalize(voies)
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Voies jamais prescriptibles par l'IDE au titre de l'arrêté. */
const VOIES_INTERDITES =
  /inject|intraveineuse|intramusculaire|perfusion|intraarticulaire|periarticulaire|perineurale|peridurale|intrathecale|infiltration|hemodialyse|hemofiltration|extracorporelle|intraperitoneale|intravesicale|uretrale|intraoculaire|intravitreenne/;

/** Antibiotiques : l'arrêté exclut tout produit en contenant. */
const ANTIBIOTIQUES = new Set([
  'clindamycine',
  'neomycine',
  'bacitracine',
  'acide fusidique',
  'mupirocine',
  'gentamicine',
  'framycetine',
  'chlortetracycline',
  'oxytetracycline',
  'tyrothricine',
  'polymyxine b',
  'colistine',
  'rifamycine',
  'sulfadiazine argentique',
  'metronidazole',
  'erythromycine',
]);

const PROGESTATIFS_CONTRACEPTIFS = [
  'levonorgestrel',
  'desogestrel',
  'gestodene',
  'norgestimate',
  'drospirenone',
  'nomegestrol',
  'chlormadinone',
  'dienogest',
];

const ESTROGENES_CONTRACEPTIFS = ['ethinylestradiol', 'estradiol', 'estetrol'];

/**
 * Règles de rattachement, évaluées dans l'ordre.
 *
 * - `substancesAutorisees` : toute substance active hors de cette liste écarte la spécialité.
 * - `substancesRequises`   : au moins une substance de cette liste doit être présente.
 * - `voiesAutorisees`      : toute voie hors de cette liste écarte la spécialité.
 * - `affiner`              : dernier filtre ; `false` écarte, un objet surcharge le niveau.
 */
export const ELIGIBILITY_RULES = [
  {
    itemArreteId: 'prod-antalgiques',
    niveau: NIVEAU.OUI,
    conditionsIde:
      'Antalgique de palier I — prescription IDE possible (Art. 1-V). Les paliers II et III sont hors liste.',
    substancesAutorisees: [
      'paracetamol',
      'ibuprofene',
      'acide acetylsalicylique',
      'acide ascorbique',
      'cafeine',
    ],
    substancesRequises: ['paracetamol', 'ibuprofene', 'acide acetylsalicylique'],
    voiesAutorisees: ['orale', 'rectale'],
    affiner: (med) => {
      const aspirineSeule =
        med.substances.includes('acide acetylsalicylique') &&
        !med.substances.includes('paracetamol') &&
        !med.substances.includes('ibuprofene');
      if (!aspirineSeule) return true;

      // Aspirine à visée antiagrégante plaquettaire : hors antalgie, donc hors liste.
      if (/gastro-resistant/.test(med.formeNorm)) return false;
      if (/kardegic|resitune|asared|aspirine protect/.test(med.nomNorm)) return false;
      const doses = dosesMg(med.nom);
      if (doses.length && Math.max(...doses) <= 160) return false;

      return {
        niveau: NIVEAU.CONDITIONS,
        conditionsIde:
          'Aspirine à visée antalgique (palier I, Art. 1-V) — vérifier les contre-indications et éviter chez l’enfant ou l’adolescent en contexte viral.',
      };
    },
  },
  {
    itemArreteId: 'tabac-substituts',
    niveau: NIVEAU.OUI,
    conditionsIde: 'Substitut nicotinique — prescription IDE possible (Art. 1-IV).',
    substancesAutorisees: ['nicotine'],
    substancesRequises: ['nicotine'],
  },
  {
    itemArreteId: 'sex-urgence',
    niveau: NIVEAU.OUI,
    conditionsIde: 'Contraception d’urgence — prescription IDE possible (Art. 1-III).',
    substancesAutorisees: ['ulipristal', 'levonorgestrel'],
    substancesRequises: ['ulipristal', 'levonorgestrel'],
    voiesAutorisees: ['orale'],
    affiner: (med) => {
      const doses = dosesMg(med.nom);
      const doseMax = doses.length ? Math.max(...doses) : 0;
      // Ulipristal 30 mg = contraception d'urgence ; 5 mg = fibrome utérin, hors liste.
      if (med.substances.includes('ulipristal')) return doseMax >= 20;
      // Lévonorgestrel 1,5 mg = contraception d'urgence ; microdosé = pilule à renouveler.
      return doseMax >= 0.7;
    },
  },
  {
    itemArreteId: 'sex-contraception-orale',
    niveau: NIVEAU.OUI,
    conditionsIde:
      'Contraceptif oral — renouvellement IDE uniquement, 6 mois maximum, à l’identique (Art. 1-III, Annexe II).',
    substancesAutorisees: [...ESTROGENES_CONTRACEPTIFS, ...PROGESTATIFS_CONTRACEPTIFS],
    substancesRequises: PROGESTATIFS_CONTRACEPTIFS,
    voiesAutorisees: ['orale'],
    affiner: (med) => {
      if (ESTROGENES_CONTRACEPTIFS.some((e) => med.substances.includes(e))) return true;

      // Progestatif seul : seules les spécialités à visée contraceptive sont concernées.
      if (med.substances.length !== 1) return false;
      const [substance] = med.substances;
      if (substance === 'desogestrel' || substance === 'drospirenone') return true;
      if (substance !== 'levonorgestrel') return false;
      const doses = dosesMg(med.nom);
      return !doses.length || Math.max(...doses) < 0.7;
    },
  },
  {
    itemArreteId: 'plaie-anesthesiques',
    niveau: NIVEAU.CONDITIONS,
    conditionsIde:
      'Anesthésique local non injectable — prescription IDE réservée à la prévention ou au traitement de la plaie (Art. 1-II). Vérifier que l’indication relève de ce cadre.',
    substancesAutorisees: ['lidocaine', 'prilocaine'],
    substancesRequises: ['lidocaine'],
    voiesAutorisees: ['cutanee'],
    affiner: (med) => {
      // L'association lidocaïne + prilocaïne est la forme d'anesthésie de surface visée.
      if (!med.substances.includes('prilocaine')) return false;
      if (/fortacin/.test(med.nomNorm)) return false;
      return true;
    },
  },
  {
    itemArreteId: 'prod-solutions',
    niveau: NIVEAU.CONDITIONS,
    conditionsIde:
      'Antiseptique à large spectre sans antibiotique (Art. 1-V). Dans le cadre restreint d’une plaie récente, voir « Antiseptiques à large spectre (plaie) » (Art. 1-II-c).',
    substancesAutorisees: [
      'povidone iodee',
      'chlorhexidine',
      'benzalkonium',
      'hexamidine',
      'chlorocresol',
      'cetrimide',
      'eosine',
      'hypochlorite de sodium',
      "peroxyde d'hydrogene",
      'mecetronium',
      'alcool',
      'alcool benzylique',
    ],
    substancesRequises: [
      'povidone iodee',
      'chlorhexidine',
      'benzalkonium',
      'hexamidine',
      'cetrimide',
      'eosine',
      'hypochlorite de sodium',
      "peroxyde d'hydrogene",
      'mecetronium',
      'alcool',
    ],
    voiesAutorisees: ['cutanee'],
  },
];

/**
 * @param {{ nom: string, substancesBrutes: string[], forme: string, voies: string }} spec
 * @returns {{ itemArreteId: string, niveau: string, conditionsIde: string } | null}
 */
export function evaluerEligibilite(spec) {
  const substances = [...new Set(spec.substancesBrutes.map(canonicalSubstance).filter(Boolean))];
  if (!substances.length) return null;
  if (substances.some((s) => ANTIBIOTIQUES.has(s))) return null;

  const voies = splitVoies(spec.voies);
  const formeNorm = normalize(spec.forme);
  if (voies.some((v) => VOIES_INTERDITES.test(v))) return null;
  if (VOIES_INTERDITES.test(formeNorm)) return null;

  const med = {
    nom: spec.nom,
    nomNorm: normalize(spec.nom),
    substances,
    voies,
    formeNorm,
  };

  for (const rule of ELIGIBILITY_RULES) {
    const autorisees = new Set(rule.substancesAutorisees);
    if (!substances.every((s) => autorisees.has(s))) continue;
    if (!rule.substancesRequises.some((s) => substances.includes(s))) continue;
    if (rule.voiesAutorisees) {
      const voiesOk = new Set(rule.voiesAutorisees);
      if (!voies.length || !voies.every((v) => voiesOk.has(v))) continue;
    }

    let niveau = rule.niveau;
    let conditionsIde = rule.conditionsIde;
    if (rule.affiner) {
      const verdict = rule.affiner(med);
      if (!verdict) continue;
      if (typeof verdict === 'object') {
        niveau = verdict.niveau ?? niveau;
        conditionsIde = verdict.conditionsIde ?? conditionsIde;
      }
    }
    return { itemArreteId: rule.itemArreteId, niveau, conditionsIde };
  }

  return null;
}
