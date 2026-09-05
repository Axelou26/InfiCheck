import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { getLocalContentInfo } from '../db/database';
import { contentUpdatesConfigured } from './config';
import {
  applyContentUpdate,
  checkContentUpdate,
  type ApplyProgress,
  type ContentUpdateAvailability,
} from './updates';

type LocalInfo = Awaited<ReturnType<typeof getLocalContentInfo>>;

export type ContentUpdateState = {
  configured: boolean;
  checking: boolean;
  applying: boolean;
  progress: ApplyProgress | null;
  availability: ContentUpdateAvailability | null;
  local: LocalInfo | null;
  error: string | null;
  lastCheckedAt: number | null;
  check: () => Promise<void>;
  apply: () => Promise<boolean>;
  refreshLocal: () => Promise<void>;
};

const AUTO_CHECK_DELAY_MS = 2500;
const RECHECK_MIN_INTERVAL_MS = 30 * 60 * 1000;

export function useContentUpdate(options?: { autoCheck?: boolean }): ContentUpdateState {
  const autoCheck = options?.autoCheck !== false;
  const configured = contentUpdatesConfigured() && Platform.OS !== 'web';
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState<ApplyProgress | null>(null);
  const [availability, setAvailability] = useState<ContentUpdateAvailability | null>(null);
  const [local, setLocal] = useState<LocalInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const busy = useRef(false);
  const lastCheckedRef = useRef(0);

  const refreshLocal = useCallback(async () => {
    try {
      setLocal(await getLocalContentInfo());
    } catch {
      setLocal(null);
    }
  }, []);

  const check = useCallback(async (force = false) => {
    if (!configured || busy.current) return;
    if (!force && Date.now() - lastCheckedRef.current < RECHECK_MIN_INTERVAL_MS) return;
    busy.current = true;
    setChecking(true);
    setError(null);
    try {
      const result = await checkContentUpdate();
      setAvailability(result);
      const now = Date.now();
      lastCheckedRef.current = now;
      setLastCheckedAt(now);
      if (result.status === 'unavailable') {
        setError(result.reason);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vérification impossible');
    } finally {
      setChecking(false);
      busy.current = false;
    }
  }, [configured]);

  const apply = useCallback(async () => {
    if (!availability || availability.status !== 'available' || busy.current) return false;
    busy.current = true;
    setApplying(true);
    setError(null);
    setProgress({ phase: 'download', progress: 0 });
    try {
      await applyContentUpdate(availability, setProgress);
      await refreshLocal();
      setAvailability({
        status: 'upToDate',
        installed: availability.manifest.contentVersion,
        manifest: availability.manifest,
      });
      setProgress(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mise à jour échouée');
      setProgress(null);
      return false;
    } finally {
      setApplying(false);
      busy.current = false;
    }
  }, [availability, refreshLocal]);

  useEffect(() => {
    void refreshLocal();
  }, [refreshLocal]);

  useEffect(() => {
    if (!configured || !autoCheck) return;
    const timer = setTimeout(() => {
      void check(true);
    }, AUTO_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [configured, autoCheck, check]);

  useEffect(() => {
    if (!configured || !autoCheck) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check(false);
    });
    return () => sub.remove();
  }, [configured, autoCheck, check]);

  return {
    configured,
    checking,
    applying,
    progress,
    availability,
    local,
    error,
    lastCheckedAt,
    check: () => check(true),
    apply,
    refreshLocal,
  };
}
