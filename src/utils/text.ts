/**
 * Même repli d’accents que sqlFold : la recherche JS et la recherche SQL
 * doivent accepter « glycemie » pour « glycémie ».
 */
const FOLD_PAIRS: readonly [string, string][] = [
  ['œ', 'oe'],
  ['Œ', 'oe'],
  ['æ', 'ae'],
  ['Æ', 'ae'],
  ['à', 'a'],
  ['á', 'a'],
  ['â', 'a'],
  ['ä', 'a'],
  ['ã', 'a'],
  ['À', 'a'],
  ['Á', 'a'],
  ['Â', 'a'],
  ['Ä', 'a'],
  ['Ã', 'a'],
  ['è', 'e'],
  ['é', 'e'],
  ['ê', 'e'],
  ['ë', 'e'],
  ['È', 'e'],
  ['É', 'e'],
  ['Ê', 'e'],
  ['Ë', 'e'],
  ['ì', 'i'],
  ['í', 'i'],
  ['î', 'i'],
  ['ï', 'i'],
  ['Ì', 'i'],
  ['Í', 'i'],
  ['Î', 'i'],
  ['Ï', 'i'],
  ['ò', 'o'],
  ['ó', 'o'],
  ['ô', 'o'],
  ['ö', 'o'],
  ['õ', 'o'],
  ['Ò', 'o'],
  ['Ó', 'o'],
  ['Ô', 'o'],
  ['Ö', 'o'],
  ['Õ', 'o'],
  ['ù', 'u'],
  ['ú', 'u'],
  ['û', 'u'],
  ['ü', 'u'],
  ['Ù', 'u'],
  ['Ú', 'u'],
  ['Û', 'u'],
  ['Ü', 'u'],
  ['ý', 'y'],
  ['ÿ', 'y'],
  ['Ý', 'y'],
  ['Ÿ', 'y'],
  ['ç', 'c'],
  ['Ç', 'c'],
  ['ñ', 'n'],
  ['Ñ', 'n'],
];

export function fold(value: string): string {
  let out = value;
  for (const [from, to] of FOLD_PAIRS) {
    out = out.split(from).join(to);
  }
  return out.toLowerCase();
}

/** Expression SQL équivalente à fold(), à appliquer à une colonne. */
export function sqlFold(column: string): string {
  let expr = column;
  for (const [from, to] of FOLD_PAIRS) {
    expr = `REPLACE(${expr}, '${from}', '${to}')`;
  }
  return `LOWER(${expr})`;
}

export function containsFold(haystack: string, query: string): boolean {
  const needle = fold(query.trim());
  if (needle.length < 2) return true;
  return fold(haystack).includes(needle);
}
