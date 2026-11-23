// miZan — Single Source of Truth State Reducer
import { applyWhatIfToBaseline } from '../engine/forecast';
import { addMonthsToYearMonth } from '../utils/dates';
import {
  CURRENT_SCHEMA_VERSION,
  EMPTY_BASELINE,
  EMPTY_WHAT_IF,
  type BaselineInput,
  type StoredData,
  type StoredItem,
  type StoredMeta,
  type WhatIfScenario,
} from '../types/finance';

export interface FinanceState {
  baseline: BaselineInput;
  items: StoredItem[];
  whatIf: WhatIfScenario;
  balanceUpdatedAt: number | null;
  meta: StoredMeta;
  updatedAt: number;
  revision: number;
}

export type FinanceAction =
  | { type: 'UPDATE_BASELINE'; baseline: BaselineInput; now?: number }
  | { type: 'UPDATE_BILLS'; fixedBills: BaselineInput['fixedBills']; now?: number }
  | { type: 'UPDATE_BUCKETS'; variableBuckets: BaselineInput['variableBuckets']; now?: number }
  | { type: 'ADD_ITEM'; item: StoredItem; now?: number }
  | { type: 'UPDATE_ITEM'; item: StoredItem; now?: number }
  | { type: 'DELETE_ITEM'; id: string; now?: number }
  | { type: 'ADD_PAYMENT'; id: string; amount: number; now?: number }
  | { type: 'RESTORE_ITEM_SAVED'; id: string; alreadySaved: number; now?: number }
  | { type: 'SET_WHAT_IF'; whatIf: WhatIfScenario; now?: number }
  | { type: 'RESET_WHAT_IF'; now?: number }
  | { type: 'APPLY_WHAT_IF'; now?: number }
  | { type: 'IMPORT_DATA'; data: StoredData; now?: number }
  | { type: 'LOAD_DEMO'; now?: number }
  | { type: 'MARK_EXPORTED'; now?: number }
  | { type: 'RESET_ALL'; now?: number }
  | { type: 'SYNC_FROM_STORAGE'; data: StoredData };

function sanitizeWhatIf(whatIf: WhatIfScenario): WhatIfScenario {
  const out: WhatIfScenario = {};
  if (
    typeof whatIf.extraMonthlySaving === 'number' &&
    Number.isFinite(whatIf.extraMonthlySaving) &&
    whatIf.extraMonthlySaving > 0
  ) {
    out.extraMonthlySaving = Math.min(1_000_000_000, Math.round(whatIf.extraMonthlySaving));
  }
  if (
    typeof whatIf.extraMonthlyExpense === 'number' &&
    Number.isFinite(whatIf.extraMonthlyExpense) &&
    whatIf.extraMonthlyExpense !== 0
  ) {
    out.extraMonthlyExpense = Math.min(1_000_000_000, Math.round(Math.abs(whatIf.extraMonthlyExpense)));
  }
  if (
    typeof whatIf.variableSpendingCutPct === 'number' &&
    Number.isFinite(whatIf.variableSpendingCutPct) &&
    whatIf.variableSpendingCutPct > 0
  ) {
    out.variableSpendingCutPct = Math.min(100, Math.max(0, Math.round(whatIf.variableSpendingCutPct)));
  }
  return out;
}

export function createInitialFinanceState(data: StoredData): FinanceState {
  return {
    baseline: data.baseline,
    items: data.items,
    whatIf: data.whatIf,
    balanceUpdatedAt: data.balanceUpdatedAt,
    meta: data.meta,
    updatedAt: data.updatedAt,
    revision: 0,
  };
}

export function toStoredData(state: FinanceState): StoredData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    baseline: state.baseline,
    items: state.items,
    whatIf: state.whatIf,
    balanceUpdatedAt: state.balanceUpdatedAt,
    meta: state.meta,
    updatedAt: state.updatedAt,
  };
}

export function createDemoData(now: Date = new Date()): StoredData {
  const nowMs = now.getTime();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    baseline: {
      fixedSalary: 12000,
      sideIncome: 1500,
      currentBalance: 15000,
      fixedBills: { rent: 4000, utilities: 800, subscriptions: 300, other: 200 },
      variableBuckets: { groceries: 2500, transport: 800, leisure: 600, other: 300 },
    },
    items: [
      {
        id: '1',
        name: 'صندوق الطوارئ',
        category: 'goal',
        totalAmount: 24000,
        alreadySaved: 6000,
        targetDate: addMonthsToYearMonth(now, 6),
        createdAt: nowMs - 86400000 * 30,
      },
      {
        id: '2',
        name: 'قرض السيارة',
        category: 'debt',
        totalAmount: 30000,
        alreadySaved: 12000,
        targetDate: addMonthsToYearMonth(now, 10),
        createdAt: nowMs - 86400000 * 60,
      },
      {
        id: '3',
        name: 'مصاريف العيد',
        category: 'shock',
        totalAmount: 8000,
        alreadySaved: 2000,
        targetDate: addMonthsToYearMonth(now, 3),
        createdAt: nowMs - 86400000 * 15,
      },
    ],
    whatIf: { ...EMPTY_WHAT_IF },
    balanceUpdatedAt: nowMs,
    meta: { lastExportAt: null },
    updatedAt: nowMs,
  };
}

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  const now = 'now' in action && action.now !== undefined ? action.now : Date.now();

  switch (action.type) {
    case 'UPDATE_BASELINE':
      return {
        ...state,
        baseline: action.baseline,
        balanceUpdatedAt: now,
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'UPDATE_BILLS':
      return {
        ...state,
        baseline: { ...state.baseline, fixedBills: action.fixedBills },
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'UPDATE_BUCKETS':
      return {
        ...state,
        baseline: { ...state.baseline, variableBuckets: action.variableBuckets },
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.item],
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => (item.id === action.item.id ? action.item : item)),
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.id),
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'ADD_PAYMENT': {
      if (!Number.isFinite(action.amount) || action.amount <= 0) return state;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id
            ? {
                ...item,
                alreadySaved: Math.min(
                  item.totalAmount,
                  Math.max(0, item.alreadySaved + Math.round(action.amount))
                ),
              }
            : item
        ),
        updatedAt: now,
        revision: state.revision + 1,
      };
    }

    case 'RESTORE_ITEM_SAVED':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id
            ? {
                ...item,
                alreadySaved: Math.min(
                  item.totalAmount,
                  Math.max(0, Math.round(action.alreadySaved))
                ),
              }
            : item
        ),
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'SET_WHAT_IF':
      return {
        ...state,
        whatIf: sanitizeWhatIf(action.whatIf),
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'RESET_WHAT_IF':
      return {
        ...state,
        whatIf: { ...EMPTY_WHAT_IF },
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'APPLY_WHAT_IF': {
      const adjusted = applyWhatIfToBaseline(state.baseline, state.whatIf);
      return {
        ...state,
        baseline: adjusted,
        whatIf: { ...EMPTY_WHAT_IF },
        updatedAt: now,
        revision: state.revision + 1,
      };
    }

    case 'IMPORT_DATA':
      return {
        baseline: action.data.baseline,
        items: action.data.items,
        whatIf: action.data.whatIf,
        balanceUpdatedAt: action.data.balanceUpdatedAt,
        meta: action.data.meta,
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'LOAD_DEMO': {
      const demo = createDemoData(new Date(now));
      return {
        baseline: demo.baseline,
        items: demo.items,
        whatIf: demo.whatIf,
        balanceUpdatedAt: demo.balanceUpdatedAt,
        meta: demo.meta,
        updatedAt: now,
        revision: state.revision + 1,
      };
    }

    case 'MARK_EXPORTED':
      return {
        ...state,
        meta: { ...state.meta, lastExportAt: now },
        updatedAt: now,
        revision: state.revision + 1,
      };

    case 'RESET_ALL':
      return {
        baseline: {
          ...EMPTY_BASELINE,
          fixedBills: { ...EMPTY_BASELINE.fixedBills },
          variableBuckets: { ...EMPTY_BASELINE.variableBuckets },
        },
        items: [],
        whatIf: { ...EMPTY_WHAT_IF },
        balanceUpdatedAt: null,
        meta: { lastExportAt: null },
        updatedAt: now,
        revision: 0,
      };

    case 'SYNC_FROM_STORAGE':
      return {
        baseline: action.data.baseline,
        items: action.data.items,
        whatIf: action.data.whatIf,
        balanceUpdatedAt: action.data.balanceUpdatedAt,
        meta: action.data.meta,
        updatedAt: action.data.updatedAt,
        revision: state.revision,
      };
  }
}
