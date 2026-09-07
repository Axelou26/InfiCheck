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

/** Libellé court : taux Assurance Maladie (BDPM), pas le reste à charge patient. */
export function remboursementLabel(remboursable: boolean, tauxLabel: string | null): string {
  if (!remboursable) return 'Non remboursable AMO';
  return tauxLabel ? `AMO ${tauxLabel}` : 'Remboursable AMO';
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
