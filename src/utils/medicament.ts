/** Dénomination BDPM : « DOLIPRANE 1000 mg, comprimé » → nom commercial « DOLIPRANE ». */
export function extractNomCommercial(denomination: string): string {
  const head = (denomination.split(',')[0] ?? denomination).trim();
  const cut = head.search(/\s+\d/);
  return cut > 0 ? head.slice(0, cut).trim() : head;
}

function normalizeTaux(raw: string): string {
  const compact = raw.replace(/\s+/g, '');
  if (!compact) return '';
  return compact.endsWith('%') ? compact : `${compact}%`;
}

function parseTauxNumber(raw: string): number | null {
  const n = Number(raw.replace(/\s+/g, '').replace('%', '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function parseTauxAgg(agg: string | null | undefined): {
  remboursable: boolean;
  tauxLabel: string | null;
} {
  if (!agg || !agg.trim()) {
    return { remboursable: false, tauxLabel: null };
  }
  const parts = [
    ...new Set(
      agg
        .split(',')
        .map((s) => normalizeTaux(s.trim()))
        .filter(Boolean),
    ),
  ];
  if (!parts.length) {
    return { remboursable: false, tauxLabel: null };
  }
  return { remboursable: true, tauxLabel: parts.join(' · ') };
}

export function isCommercialise(etat: string | null | undefined): boolean {
  return /^commercialis/i.test((etat ?? '').trim());
}

/** Libellé court : taux Assurance Maladie, pas le reste à charge patient. */
export function remboursementLabel(remboursable: boolean, tauxLabel: string | null): string {
  if (!remboursable) return 'Non remboursé';
  if (!tauxLabel) return 'Remboursé';
  return `Remboursé ${tauxLabel.replace(/(\d)\s*%/g, '$1 %')}`;
}

const PETITS_MOTS = new Set(['et', 'de', 'du', 'des', 'la', 'le', 'les', 'en', 'au', 'aux']);

/** « DOLIPRANE ENFANTS » → « Doliprane Enfants ». */
export function nomLisible(raw: string): string {
  let mot = 0;
  return raw.toLocaleLowerCase('fr-FR').replace(/[a-zà-ÿ]+(?:['’][a-zà-ÿ]+)*/g, (word) => {
    const garder = mot > 0 && PETITS_MOTS.has(word);
    mot += 1;
    if (garder) return word;
    return word.charAt(0).toLocaleUpperCase('fr-FR') + word.slice(1);
  });
}

/** « PARACÉTAMOL | CAFÉINE ANHYDRE » → « Paracétamol, caféine anhydre ». */
export function moleculesLisibles(substances: string): string {
  return substances
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part && part !== '—')
    .map((part) => {
      const lower = part.toLocaleLowerCase('fr-FR');
      return lower.charAt(0).toLocaleUpperCase('fr-FR') + lower.slice(1);
    })
    .join(', ');
}

/** « DOLIPRANE 1000 mg, comprimé » + « DOLIPRANE » → « 1000 mg, comprimé ». */
export function formeCourte(nom: string, nomCommercial: string): string {
  const commercial = nomCommercial.trim();
  let rest = nom.trim();
  if (
    commercial &&
    rest.toLocaleLowerCase('fr-FR').startsWith(commercial.toLocaleLowerCase('fr-FR'))
  ) {
    rest = rest.slice(commercial.length).trim().replace(/^,\s*/, '');
  }
  if (!rest) return nom.trim();
  return rest.toLocaleLowerCase('fr-FR');
}

/** True si au moins un taux AMO est inférieur à 100 % (complément mutuelle possible). */
export function hasResteAChargeAmo(tauxLabel: string | null): boolean {
  if (!tauxLabel) return false;
  return tauxLabel.split('·').some((part) => {
    const n = parseTauxNumber(part.trim());
    return n !== null && n < 100;
  });
}

export const REMBOURSEMENT_MUTUELLE_HINT =
  'Taux Assurance Maladie (BDPM). Le reste à charge peut être pris en charge par la mutuelle, selon le contrat du patient.';
