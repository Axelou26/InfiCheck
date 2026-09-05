/**
 * URL du manifeste de contenu distant.
 * Définir `EXPO_PUBLIC_CONTENT_MANIFEST_URL` au build (CDN, GitHub Releases, R2…).
 * Sans URL, l'app reste sur la base bundlée — pas d'appel réseau.
 */
export function getContentManifestUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_CONTENT_MANIFEST_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function contentUpdatesConfigured(): boolean {
  return getContentManifestUrl() !== null;
}
