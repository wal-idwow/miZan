import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyWhatIfToBaseline } from '../engine/forecast';
import { migrateV1ToV2 } from './migrate';
import {
  PRE_IMPORT_KEY,
  RECOVERED_PREFIX,
  loadPreImportSnapshot,
  loadState,
  parseImportFile,
  probeStorage,
  savePreImportSnapshot,
  saveState,
} from './storage';
import {
  createDemoData,
  createInitialFinanceState,
  financeReducer,
  toStoredData,
} from '../state/financeReducer';
import { selectBaselineForecast, toEngineItems } from '../state/selectors';
import { STORAGE_KEY, type StoredDataV1 } from '../types/finance';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: key => map.get(key) ?? null,
    key: index => Array.from(map.keys())[index] ?? null,
    removeItem: key => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('Migration, Selectors, Reducer & Storage Resilience', () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  });

  it('migrates v1 targetMonth across year boundaries to YYYY-MM and preserves balanceUpdatedAt', () => {
    const now = new Date(2026, 10, 15); // Nov 2026
    const v1: StoredDataV1 = {
      schemaVersion: 1,
      baseline: {
        fixedSalary: 12000,
        sideIncome: 0,
        currentBalance: 4000,
        fixedBills: { rent: 3000, utilities: 500, subscriptions: 0, other: 0 },
        variableBuckets: { groceries: 2000, transport: 500, leisure: 500, other: 0 },
      },
      items: [
        { id: '0', name: 'Now', category: 'shock', totalAmount: 1000, alreadySaved: 0, targetMonth: 0, createdAt: 1 },
        { id: '1', name: '3m', category: 'goal', totalAmount: 3000, alreadySaved: 0, targetMonth: 3, createdAt: 2 },
        { id: '2', name: '14m', category: 'debt', totalAmount: 14000, alreadySaved: 0, targetMonth: 14, createdAt: 3 },
      ],
      whatIf: {},
      updatedAt: 1700000000000,
    };

    const v2 = migrateV1ToV2(v1, now);
    expect(v2.schemaVersion).toBe(2);
    expect(v2.items.map(i => i.targetDate)).toEqual(['2026-11', '2027-02', '2028-01']);
    expect(v2.balanceUpdatedAt).toBe(1700000000000);
    expect(v2.meta).toEqual({ lastExportAt: null });

    // Round-trip into engine items on the same date
    const engineItems = toEngineItems(v2.items, now);
    expect(engineItems.map(i => i.targetMonth)).toEqual([0, 3, 14]);

    // Two months later (Jan 2027), the 3m item has aged to 1 month remaining and Now item is overdue (-2)
    const twoMonthsLater = new Date(2027, 0, 10);
    const agedItems = toEngineItems(v2.items, twoMonthsLater);
    expect(agedItems.map(i => i.targetMonth)).toEqual([-2, 1, 12]);
  });

  it('keeps baseline forecast isolated from active What-If and Apply matches applyWhatIfToBaseline', () => {
    const demo = createDemoData(new Date(2026, 10, 1));
    let state = createInitialFinanceState(demo);
    state = financeReducer(state, {
      type: 'SET_WHAT_IF',
      whatIf: {
        extraMonthlySaving: 1000,
        extraMonthlyExpense: 500,
        variableSpendingCutPct: 20,
      },
    });

    const baselineForecast = selectBaselineForecast(
      state.baseline,
      state.items,
      new Date(2026, 10, 1)
    );
    expect(baselineForecast.baseline.sideIncome).toBe(1500);

    const expectedApplied = applyWhatIfToBaseline(state.baseline, state.whatIf);
    const appliedState = financeReducer(state, { type: 'APPLY_WHAT_IF' });
    expect(appliedState.baseline).toEqual(expectedApplied);
    expect(appliedState.whatIf).toEqual({});
    expect(toStoredData(appliedState).schemaVersion).toBe(2);
  });

  it('clamps ADD_PAYMENT, supports RESTORE_ITEM_SAVED undo, and keeps revision stable on SYNC_FROM_STORAGE', () => {
    const demo = createDemoData(new Date(2026, 10, 1));
    let state = createInitialFinanceState(demo);
    state = financeReducer(state, { type: 'ADD_PAYMENT', id: '3', amount: 999999 });
    expect(state.items.find(i => i.id === '3')?.alreadySaved).toBe(8000);

    state = financeReducer(state, { type: 'RESTORE_ITEM_SAVED', id: '3', alreadySaved: 2000 });
    expect(state.items.find(i => i.id === '3')?.alreadySaved).toBe(2000);

    const revBeforeSync = state.revision;
    const synced = financeReducer(state, { type: 'SYNC_FROM_STORAGE', data: demo });
    expect(synced.revision).toBe(revBeforeSync);
  });

  it('quarantines corrupt JSON and partial schemas without overwriting STORAGE_KEY', () => {
    const now = new Date(2026, 10, 23, 12, 0, 0);
    const rawCorrupt = '{"schemaVersion": 2, "broken": ';
    globalThis.localStorage.setItem(STORAGE_KEY, rawCorrupt);

    const res = loadState(now);
    expect(res.status).toBe('corrupt');
    if (res.status === 'corrupt') {
      expect(res.recoveredKey).toBe(`${RECOVERED_PREFIX}${now.getTime()}`);
      expect(globalThis.localStorage.getItem(res.recoveredKey)).toBe(rawCorrupt);
    }
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBe(rawCorrupt);
  });

  it('auto-migrates stored v1 payload to v2 in localStorage', () => {
    const now = new Date(2026, 10, 23);
    const v1: StoredDataV1 = {
      schemaVersion: 1,
      baseline: {
        fixedSalary: 7000,
        sideIncome: 0,
        currentBalance: 1000,
        fixedBills: { rent: 2000, utilities: 300, subscriptions: 0, other: 0 },
        variableBuckets: { groceries: 1200, transport: 300, leisure: 200, other: 0 },
      },
      items: [],
      whatIf: {},
      updatedAt: 1700000000000,
    };
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(v1));

    const res = loadState(now);
    expect(res.status).toBe('ok');
    if (res.status === 'ok') {
      expect(res.migratedFrom).toBe(1);
      expect(res.data.schemaVersion).toBe(2);
    }
    const persisted = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY) || '{}');
    expect(persisted.schemaVersion).toBe(2);
  });

  it('handles storage unavailable and QuotaExceededError cleanly', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new Error('SecurityError');
      },
      configurable: true,
    });
    expect(probeStorage()).toBe('memory');
    expect(loadState()).toMatchObject({ status: 'empty', storageMode: 'memory' });
    expect(saveState(createDemoData())).toEqual({ ok: false, code: 'unavailable' });

    const quotaStorage: Storage = {
      ...createMemoryStorage(),
      setItem: () => {
        const err = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      },
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: quotaStorage,
      configurable: true,
      writable: true,
    });
    expect(saveState(createDemoData())).toEqual({ ok: false, code: 'quota' });
  });

  it('saves/loads pre-import snapshots and validates import files safely', async () => {
    const demo = createDemoData(new Date(2026, 10, 23));
    expect(savePreImportSnapshot(demo)).toBe(true);
    expect(globalThis.localStorage.getItem(PRE_IMPORT_KEY)).not.toBeNull();
    expect(loadPreImportSnapshot()?.items).toHaveLength(3);

    const oversized = { size: 1_000_001, text: async () => '{}' } as unknown as File;
    expect(await parseImportFile(oversized)).toEqual({ ok: false, code: 'tooLarge' });

    const badJsonFile = new File(['{bad'], 'bad.json', { type: 'application/json' });
    expect(await parseImportFile(badJsonFile)).toEqual({ ok: false, code: 'notJson' });

    const futureFile = new File(
      [JSON.stringify({ ...demo, schemaVersion: 99 })],
      'future.json',
      { type: 'application/json' }
    );
    expect(await parseImportFile(futureFile)).toEqual({ ok: false, code: 'futureVersion' });

    const goodFile = new File([JSON.stringify(demo)], 'ok.json', { type: 'application/json' });
    const okRes = await parseImportFile(goodFile);
    expect(okRes.ok).toBe(true);
  });
});
