// miZan — Local-First Storage Driver, Recovery & JSON Backup I/O
import { STORAGE_KEY, type StoredData } from '../types/finance';
import {
  MAX_IMPORT_BYTES,
  createEmptyStoredData,
  parseStoredData,
  type ParseErrorCode,
} from './schema';

export const RECOVERED_PREFIX = 'mizan-data.recovered.';
export const PRE_IMPORT_KEY = 'mizan-data.pre-import';
export const PROBE_KEY = 'mizan-storage-probe';

export type StorageMode = 'persistent' | 'memory';
export type SaveErrorCode = 'quota' | 'unavailable';
export type ImportErrorCode =
  | 'tooLarge'
  | 'readFailed'
  | 'notJson'
  | 'futureVersion'
  | 'invalidShape';

export type LoadStateResult =
  | { status: 'empty'; data: StoredData; storageMode: StorageMode }
  | { status: 'ok'; data: StoredData; migratedFrom?: number; storageMode: 'persistent' }
  | {
      status: 'corrupt';
      data: StoredData;
      recoveredKey: string;
      rawBackup: string;
      errorCode: ParseErrorCode | 'notJson';
      storageMode: 'persistent';
    };

export type SaveStateResult = { ok: true } | { ok: false; code: SaveErrorCode };

export type ImportFileResult =
  | { ok: true; data: StoredData; migratedFrom?: number }
  | { ok: false; code: ImportErrorCode };

let persistRequested = false;

function getLocalStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

export function probeStorage(): StorageMode {
  const ls = getLocalStorage();
  if (!ls) return 'memory';
  try {
    ls.setItem(PROBE_KEY, '1');
    ls.removeItem(PROBE_KEY);
    return 'persistent';
  } catch {
    return 'memory';
  }
}

export function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const record = err as { name?: unknown; code?: unknown };
  return (
    record.name === 'QuotaExceededError' ||
    record.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    record.code === 22 ||
    record.code === 1014
  );
}

export function saveState(data: StoredData): SaveStateResult {
  const ls = getLocalStorage();
  if (!ls) return { ok: false, code: 'unavailable' };
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    return { ok: false, code: isQuotaError(err) ? 'quota' : 'unavailable' };
  }
}

export function loadState(now: Date = new Date()): LoadStateResult {
  if (probeStorage() === 'memory') {
    return { status: 'empty', data: createEmptyStoredData(now), storageMode: 'memory' };
  }

  const ls = getLocalStorage();
  if (!ls) {
    return { status: 'empty', data: createEmptyStoredData(now), storageMode: 'memory' };
  }

  let raw: string | null = null;
  try {
    raw = ls.getItem(STORAGE_KEY);
  } catch {
    return { status: 'empty', data: createEmptyStoredData(now), storageMode: 'memory' };
  }

  if (raw === null) {
    return { status: 'empty', data: createEmptyStoredData(now), storageMode: 'persistent' };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    const recoveredKey = `${RECOVERED_PREFIX}${now.getTime()}`;
    try {
      ls.setItem(recoveredKey, raw);
    } catch {
      // Ignore storage errors while quarantining raw payload
    }
    return {
      status: 'corrupt',
      data: createEmptyStoredData(now),
      recoveredKey,
      rawBackup: raw,
      errorCode: 'notJson',
      storageMode: 'persistent',
    };
  }

  const validation = parseStoredData(parsedJson, now);
  if (!validation.ok) {
    const recoveredKey = `${RECOVERED_PREFIX}${now.getTime()}`;
    try {
      ls.setItem(recoveredKey, raw);
    } catch {
      // Ignore storage errors while quarantining raw payload
    }
    return {
      status: 'corrupt',
      data: createEmptyStoredData(now),
      recoveredKey,
      rawBackup: raw,
      errorCode: validation.code,
      storageMode: 'persistent',
    };
  }

  if (validation.migratedFrom !== undefined) {
    saveState(validation.data);
  }

  return {
    status: 'ok',
    data: validation.data,
    migratedFrom: validation.migratedFrom,
    storageMode: 'persistent',
  };
}

export function clearStoredData(): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  try {
    ls.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function savePreImportSnapshot(data: StoredData): boolean {
  const ls = getLocalStorage();
  if (!ls) return false;
  try {
    ls.setItem(PRE_IMPORT_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadPreImportSnapshot(now: Date = new Date()): StoredData | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(PRE_IMPORT_KEY);
    if (!raw) return null;
    const parsed = parseStoredData(JSON.parse(raw), now);
    return parsed.ok ? parsed.data : null;
  } catch {
    return null;
  }
}

export function requestPersistentStorageOnce(): void {
  if (persistRequested) return;
  persistRequested = true;
  try {
    const storageApi = globalThis.navigator?.storage;
    if (storageApi && typeof storageApi.persist === 'function') {
      void storageApi.persist().catch(() => {});
    }
  } catch {
    // Persistent storage API unavailable
  }
}

export function downloadRawText(
  content: string,
  filename: string,
  mimeType: string = 'application/json'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function exportBackupFile(data: StoredData, now: Date = new Date()): void {
  const dateStamp = now.toISOString().split('T')[0];
  downloadRawText(JSON.stringify(data, null, 2), `mizan-backup-${dateStamp}.json`);
}

export async function parseImportFile(
  file: File,
  now: Date = new Date()
): Promise<ImportFileResult> {
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, code: 'tooLarge' };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, code: 'readFailed' };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { ok: false, code: 'notJson' };
  }

  const result = parseStoredData(parsedJson, now);
  if (!result.ok) {
    return {
      ok: false,
      code: result.code === 'futureVersion' ? 'futureVersion' : 'invalidShape',
    };
  }

  return {
    ok: true,
    data: result.data,
    migratedFrom: result.migratedFrom,
  };
}
