/** Identifiant unique d'un paquet contenu (BDPM + catalogue arrêté). */
export type ContentVersion = {
  importedAt: string;
  catalogVersion: string;
};

export type ContentManifest = {
  schema: 1;
  contentVersion: string;
  importedAt: string;
  catalogVersion: string;
  cisCount: number;
  eligibleIdeApprox: number;
  notes?: string;
  publishedAt?: string;
  db: {
    /** URL absolue du fichier SQLite, ou chemin relatif au manifeste. */
    url: string;
    bytes: number;
    sha256?: string;
  };
};

/** Clé comparable : dates ISO + version catalogue. Lexicographique = chronologique. */
export function toContentVersionKey(importedAt: string, catalogVersion: string): string {
  const day = importedAt.trim().slice(0, 10);
  return `${day}+${catalogVersion.trim()}`;
}

export function parseContentVersionKey(key: string): ContentVersion | null {
  const sep = key.indexOf('+');
  if (sep <= 0) return null;
  const importedAt = key.slice(0, sep);
  const catalogVersion = key.slice(sep + 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(importedAt) || !catalogVersion) return null;
  return { importedAt, catalogVersion };
}

export function isNewerContentVersion(candidate: string, current: string): boolean {
  if (!candidate || !current) return Boolean(candidate && !current);
  return candidate > current;
}

export function isContentManifest(value: unknown): value is ContentManifest {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<ContentManifest>;
  return (
    m.schema === 1 &&
    typeof m.contentVersion === 'string' &&
    typeof m.importedAt === 'string' &&
    typeof m.catalogVersion === 'string' &&
    typeof m.cisCount === 'number' &&
    typeof m.eligibleIdeApprox === 'number' &&
    !!m.db &&
    typeof m.db.url === 'string' &&
    typeof m.db.bytes === 'number' &&
    m.db.bytes > 0
  );
}

export function resolveManifestAssetUrl(manifestUrl: string, assetUrl: string): string {
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl;
  return new URL(assetUrl, manifestUrl).toString();
}
