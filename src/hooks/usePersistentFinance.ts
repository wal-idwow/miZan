// miZan — Persistent Finance State Hook (debounced flush, recovery & cross-tab sync)
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { STORAGE_KEY } from '../types/finance';
import { parseStoredData } from '../storage/schema';
import {
  clearStoredData,
  downloadRawText,
  loadState,
  requestPersistentStorageOnce,
  saveState,
  type LoadStateResult,
  type SaveErrorCode,
  type StorageMode,
} from '../storage/storage';
import {
  createInitialFinanceState,
  financeReducer,
  toStoredData,
  type FinanceState,
} from '../state/financeReducer';

export interface StorageStatus {
  mode: StorageMode;
  saveError: SaveErrorCode | null;
  corruptBackup: { recoveredKey: string; rawBackup: string } | null;
}

interface UsePersistentFinanceOptions {
  onCrossTabSync?: () => void;
}

const SAVE_DEBOUNCE_MS = 300;

export function usePersistentFinance(options: UsePersistentFinanceOptions = {}) {
  const [initialLoad] = useState<LoadStateResult>(() => loadState());
  const onCrossTabSyncRef = useRef(options.onCrossTabSync);

  const [state, dispatch] = useReducer(
    financeReducer,
    initialLoad.data,
    createInitialFinanceState
  );

  const [storageStatus, setStorageStatus] = useState<StorageStatus>(() => ({
    mode: initialLoad.storageMode,
    saveError: null,
    corruptBackup:
      initialLoad.status === 'corrupt'
        ? { recoveredKey: initialLoad.recoveredKey, rawBackup: initialLoad.rawBackup }
        : null,
  }));

  const latestStateRef = useRef<FinanceState>(state);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onCrossTabSyncRef.current = options.onCrossTabSync;
  }, [options.onCrossTabSync]);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  const flushNow = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current) return;
    dirtyRef.current = false;

    const result = saveState(toStoredData(latestStateRef.current));
    if (result.ok) {
      requestPersistentStorageOnce();
      setStorageStatus(prev => (prev.saveError !== null ? { ...prev, saveError: null } : prev));
    } else {
      setStorageStatus(prev => ({
        ...prev,
        mode: result.code === 'unavailable' ? 'memory' : prev.mode,
        saveError: result.code,
      }));
    }
  }, []);

  useEffect(() => {
    if (state.revision === 0) {
      dirtyRef.current = false;
      return;
    }
    dirtyRef.current = true;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      flushNow();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.revision, state.updatedAt, flushNow]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushNow();
      }
    };
    const handlePageHide = () => {
      flushNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      flushNow();
    };
  }, [flushNow]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue === null) return;
      try {
        const parsedJson: unknown = JSON.parse(event.newValue);
        const validation = parseStoredData(parsedJson);
        if (validation.ok) {
          dirtyRef.current = false;
          if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          dispatch({ type: 'SYNC_FROM_STORAGE', data: validation.data });
          onCrossTabSyncRef.current?.();
        }
      } catch {
        // Ignore malformed cross-tab storage payload
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const dismissRecovered = useCallback(() => {
    setStorageStatus(prev => ({ ...prev, corruptBackup: null }));
  }, []);

  const downloadRecovered = useCallback(() => {
    const backup = storageStatus.corruptBackup;
    if (!backup) return;
    downloadRawText(backup.rawBackup, `${backup.recoveredKey}.json`);
  }, [storageStatus.corruptBackup]);

  const resetAll = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    dirtyRef.current = false;
    clearStoredData();
    dispatch({ type: 'RESET_ALL' });
    setStorageStatus(prev => ({ ...prev, saveError: null, corruptBackup: null }));
  }, []);

  return {
    state,
    dispatch,
    storageStatus,
    dismissRecovered,
    downloadRecovered,
    flushNow,
    resetAll,
  };
}
