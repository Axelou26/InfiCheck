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

export function remboursementLabel(remboursable: boolean, tauxLabel: string | null): string {
  if (!remboursable) return 'Non remboursable';
  return tauxLabel ? `Remboursable ${tauxLabel}` : 'Remboursable';
}
