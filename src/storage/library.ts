import AsyncStorage from '@react-native-async-storage/async-storage';

export type LibraryKind = 'arrete' | 'med';

export type LibraryEntry = {
  kind: LibraryKind;
  id: string;
  title: string;
  subtitle?: string;
  /** Teinte de la fiche, rejouée sur les tuiles de l'accueil sans relire la base. */
  accent?: string;
  at: number;
};

const KEY_RECENTS = 'inficheck:recents';
const KEY_FAVORITES = 'inficheck:favorites';
const KEY_QUERIES = 'inficheck:search-queries';

const MAX_RECENTS = 12;
const MAX_FAVORITES = 24;
const MAX_QUERIES = 8;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeLibrary(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function entryKey(entry: Pick<LibraryEntry, 'kind' | 'id'>): string {
  return `${entry.kind}:${entry.id}`;
}

async function readList(key: string): Promise<LibraryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLibraryEntry);
  } catch {
    return [];
  }
}

function isLibraryEntry(value: unknown): value is LibraryEntry {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<LibraryEntry>;
  return (
    (row.kind === 'arrete' || row.kind === 'med') &&
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    typeof row.at === 'number'
  );
}

async function writeList(key: string, entries: LibraryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(entries));
    emit();
  } catch {
    // Stockage plein ou indisponible : on n'bloque pas la consultation.
  }
}

export async function readRecents(): Promise<LibraryEntry[]> {
  return readList(KEY_RECENTS);
}

export async function readFavorites(): Promise<LibraryEntry[]> {
  return readList(KEY_FAVORITES);
}

export async function readQueries(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_QUERIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
  } catch {
    return [];
  }
}

export async function pushRecent(entry: Omit<LibraryEntry, 'at'>): Promise<void> {
  const next: LibraryEntry = { ...entry, at: Date.now() };
  const current = await readRecents();
  const deduped = [next, ...current.filter((row) => entryKey(row) !== entryKey(next))].slice(
    0,
    MAX_RECENTS,
  );
  await writeList(KEY_RECENTS, deduped);
}

export async function pushQuery(term: string): Promise<void> {
  const cleaned = term.trim();
  if (cleaned.length < 2) return;
  try {
    const current = await readQueries();
    const next = [cleaned, ...current.filter((row) => row.toLowerCase() !== cleaned.toLowerCase())].slice(
      0,
      MAX_QUERIES,
    );
    await AsyncStorage.setItem(KEY_QUERIES, JSON.stringify(next));
    emit();
  } catch {
    // Ignoré volontairement.
  }
}

export async function isFavorite(kind: LibraryKind, id: string): Promise<boolean> {
  const favorites = await readFavorites();
  return favorites.some((row) => row.kind === kind && row.id === id);
}

export async function toggleFavorite(entry: Omit<LibraryEntry, 'at'>): Promise<boolean> {
  const current = await readFavorites();
  const exists = current.some((row) => entryKey(row) === entryKey(entry));
  const next = exists
    ? current.filter((row) => entryKey(row) !== entryKey(entry))
    : [{ ...entry, at: Date.now() }, ...current].slice(0, MAX_FAVORITES);
  await writeList(KEY_FAVORITES, next);
  return !exists;
}
