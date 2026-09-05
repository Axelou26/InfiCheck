import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  isFavorite,
  readFavorites,
  readQueries,
  readRecents,
  subscribeLibrary,
  type LibraryEntry,
  type LibraryKind,
} from '../storage/library';

export function useLibrary() {
  const [recents, setRecents] = useState<LibraryEntry[]>([]);
  const [favorites, setFavorites] = useState<LibraryEntry[]>([]);
  const [queries, setQueries] = useState<string[]>([]);

  const reload = useCallback(async () => {
    const [nextRecents, nextFavorites, nextQueries] = await Promise.all([
      readRecents(),
      readFavorites(),
      readQueries(),
    ]);
    setRecents(nextRecents);
    setFavorites(nextFavorites);
    setQueries(nextQueries);
  }, []);

  useEffect(() => subscribeLibrary(() => void reload()), [reload]);
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { recents, favorites, queries, reload };
}

export function useIsFavorite(kind: LibraryKind, id: string | undefined) {
  const [on, setOn] = useState(false);

  const reload = useCallback(async () => {
    if (!id) {
      setOn(false);
      return;
    }
    setOn(await isFavorite(kind, id));
  }, [kind, id]);

  useEffect(() => subscribeLibrary(() => void reload()), [reload]);
  useEffect(() => {
    void reload();
  }, [reload]);

  return on;
}
