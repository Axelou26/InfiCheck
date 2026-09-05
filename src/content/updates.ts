import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import {
  getBundledContentMeta,
  getNativeDownloadPath,
  installNativeDatabaseFromFile,
  openTemporaryDatabase,
  readInstalledContentVersion,
} from '../db/database';
import { contentUpdatesConfigured, getContentManifestUrl } from './config';
import {
  isContentManifest,
  isNewerContentVersion,
  resolveManifestAssetUrl,
  type ContentManifest,
} from './version';

const DOWNLOAD_NAME = 'inficheck.download.db';
const SIZE_TOLERANCE = 0.02; // 2 % — compression CDN / en-têtes parfois approximatifs

export type ContentUpdateAvailability =
  | { status: 'disabled' }
  | { status: 'unavailable'; reason: string }
  | { status: 'upToDate'; installed: string; manifest: ContentManifest }
  | { status: 'available'; installed: string; manifest: ContentManifest; dbUrl: string };

export type ApplyProgress = {
  phase: 'download' | 'validate' | 'install';
  /** 0 → 1 pendant le téléchargement ; 1 ensuite. */
  progress: number;
};

function downloadPath(): string {
  return getNativeDownloadPath(DOWNLOAD_NAME);
}

async function fetchManifest(url: string): Promise<ContentManifest> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Manifeste inaccessible (${res.status})`);
    }
    const json: unknown = await res.json();
    if (!isContentManifest(json)) {
      throw new Error('Manifeste de contenu invalide');
    }
    const expected = `${json.importedAt.slice(0, 10)}+${json.catalogVersion}`;
    if (json.contentVersion !== expected) {
      throw new Error('contentVersion incohérent avec importedAt / catalogVersion');
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkContentUpdate(): Promise<ContentUpdateAvailability> {
  if (Platform.OS === 'web') {
    return { status: 'unavailable', reason: 'Mises à jour indisponibles sur le web' };
  }
  const manifestUrl = getContentManifestUrl();
  if (!manifestUrl) {
    return { status: 'disabled' };
  }

  try {
    const manifest = await fetchManifest(manifestUrl);
    const installed =
      (await readInstalledContentVersion()) ?? getBundledContentMeta().contentVersion;
    const dbUrl = resolveManifestAssetUrl(manifestUrl, manifest.db.url);

    if (!isNewerContentVersion(manifest.contentVersion, installed)) {
      return { status: 'upToDate', installed, manifest };
    }
    return { status: 'available', installed, manifest, dbUrl };
  } catch (e) {
    return {
      status: 'unavailable',
      reason: e instanceof Error ? e.message : 'Vérification impossible',
    };
  }
}

async function validateDownloadedDatabase(
  fileName: string,
  manifest: ContentManifest,
): Promise<void> {
  const db = await openTemporaryDatabase(fileName);
  try {
    const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM medicaments');
    if (!count || count.c < 1000) {
      throw new Error('Base téléchargée invalide ou incomplète');
    }
    if (Math.abs(count.c - manifest.cisCount) > Math.max(50, manifest.cisCount * 0.05)) {
      throw new Error(
        `Effectif médicaments incohérent (${count.c} vs ${manifest.cisCount} attendus)`,
      );
    }

    const imported = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM meta WHERE key = 'bdpm_imported_at'",
    );
    const catalog = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM meta WHERE key = 'arrete_catalog_version'",
    );
    if (!imported?.value?.startsWith(manifest.importedAt.slice(0, 10))) {
      throw new Error('Date d’import BDPM du fichier ne correspond pas au manifeste');
    }
    if (catalog?.value !== manifest.catalogVersion) {
      throw new Error('Version catalogue du fichier ne correspond pas au manifeste');
    }
  } finally {
    await db.closeAsync().catch(() => undefined);
  }
}

/**
 * Télécharge, valide et installe le paquet. La base active est remplacée atomiquement
 * (fermeture → copie → réouverture). En cas d'échec, l'ancienne base reste en place
 * tant que `installNativeDatabaseFromFile` n'a pas commencé.
 */
export async function applyContentUpdate(
  update: Extract<ContentUpdateAvailability, { status: 'available' }>,
  onProgress?: (progress: ApplyProgress) => void,
): Promise<void> {
  if (!contentUpdatesConfigured()) {
    throw new Error('Aucune URL de manifeste configurée');
  }

  const target = downloadPath();
  await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => undefined);

  onProgress?.({ phase: 'download', progress: 0 });

  const task = FileSystem.createDownloadResumable(
    update.dbUrl,
    target,
    {},
    (event) => {
      const total = event.totalBytesExpectedToWrite;
      const written = event.totalBytesWritten;
      const progress = total > 0 ? Math.min(0.99, written / total) : 0;
      onProgress?.({ phase: 'download', progress });
    },
  );

  const result = await task.downloadAsync();
  if (!result?.uri) {
    throw new Error('Téléchargement interrompu');
  }

  const info = await FileSystem.getInfoAsync(result.uri);
  if (!info.exists || info.isDirectory) {
    throw new Error('Fichier téléchargé introuvable');
  }
  const size = 'size' in info ? info.size : 0;
  const expected = update.manifest.db.bytes;
  if (size > 0 && Math.abs(size - expected) / expected > SIZE_TOLERANCE) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => undefined);
    throw new Error(
      `Taille incorrecte (${size.toLocaleString('fr-FR')} o vs ${expected.toLocaleString('fr-FR')} o)`,
    );
  }

  onProgress?.({ phase: 'validate', progress: 1 });
  await validateDownloadedDatabase(DOWNLOAD_NAME, update.manifest);

  onProgress?.({ phase: 'install', progress: 1 });
  await installNativeDatabaseFromFile(result.uri, update.manifest.contentVersion);
}
