// miZan — Zero-dependency runtime schema validation for StoredData (v1 & v2)
import {
  CURRENT_SCHEMA_VERSION,
  EMPTY_BASELINE,
  EMPTY_WHAT_IF,
  type BaselineInput,
  type FinanceItem,
  type FixedBills,
  type ItemCategory,
  type StoredData,
  type StoredDataV1,
  type StoredItem,
  type StoredMeta,
  type VariableBuckets,
  type WhatIfScenario,
} from '../types/finance';
import { isValidYearMonth } from '../utils/dates';
import { generateId } from '../utils/ids';
import { runMigrations } from './migrate';

export const MAX_AMOUNT = 1_000_000_000;
export const MIN_BALANCE = -1_000_000_000;
export const MAX_ITEMS = 500;
export const MAX_IMPORT_BYTES = 1_000_000;

const VALID_CATEGORIES = new Set<string>(['goal', 'shock', 'debt']);

export type ParseErrorCode = 'notObject' | 'futureVersion' | 'invalidShape';

export type ParseResult =
  | { ok: true; data: StoredData; migratedFrom?: number }
  | { ok: false; code: ParseErrorCode; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function readOwn(obj: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

function normalizeZero(n: number): number {
  return Object.is(n, -0) ? 0 : n;
}

function parseIntAmount(
  value: unknown,
  opts: { min?: number; max?: number; required?: boolean; defaultValue?: number } = {}
): number | null {
  const min = opts.min ?? 0;
  const max = opts.max ?? MAX_AMOUNT;
  if (value === undefined) {
    if (opts.required) return null;
    return opts.defaultValue ?? 0;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  if (value < min || value > max) {
    return null;
  }
  return normalizeZero(Math.round(value));
}

function parseFixedBills(raw: unknown): FixedBills | null {
  if (!isPlainObject(raw)) return null;
  const rent = parseIntAmount(readOwn(raw, 'rent'));
  const utilities = parseIntAmount(readOwn(raw, 'utilities'));
  const subscriptions = parseIntAmount(readOwn(raw, 'subscriptions'));
  const other = parseIntAmount(readOwn(raw, 'other'));
  if (rent === null || utilities === null || subscriptions === null || other === null) {
    return null;
  }
  return { rent, utilities, subscriptions, other };
}

function parseVariableBuckets(raw: unknown): VariableBuckets | null {
  if (!isPlainObject(raw)) return null;
  const groceries = parseIntAmount(readOwn(raw, 'groceries'));
  const transport = parseIntAmount(readOwn(raw, 'transport'));
  const leisure = parseIntAmount(readOwn(raw, 'leisure'));
  const other = parseIntAmount(readOwn(raw, 'other'));
  if (groceries === null || transport === null || leisure === null || other === null) {
    return null;
  }
  return { groceries, transport, leisure, other };
}

function parseBaseline(raw: unknown): BaselineInput | null {
  if (!isPlainObject(raw)) return null;
  const fixedSalary = parseIntAmount(readOwn(raw, 'fixedSalary'));
  const sideIncome = parseIntAmount(readOwn(raw, 'sideIncome'));
  const currentBalance = parseIntAmount(readOwn(raw, 'currentBalance'), {
    min: MIN_BALANCE,
    max: MAX_AMOUNT,
  });
  const fixedBills = parseFixedBills(readOwn(raw, 'fixedBills'));
  const variableBuckets = parseVariableBuckets(readOwn(raw, 'variableBuckets'));

  if (
    fixedSalary === null ||
    sideIncome === null ||
    currentBalance === null ||
    fixedBills === null ||
    variableBuckets === null
  ) {
    return null;
  }

  return {
    fixedSalary,
    sideIncome,
    currentBalance,
    fixedBills,
    variableBuckets,
  };
}

function parseWhatIf(raw: unknown): WhatIfScenario | null {
  if (raw === undefined) {
    return { ...EMPTY_WHAT_IF };
  }
  if (!isPlainObject(raw)) {
    return null;
  }

  const out: WhatIfScenario = {};

  const savingRaw = readOwn(raw, 'extraMonthlySaving');
  if (savingRaw !== undefined) {
    if (typeof savingRaw !== 'number' || !Number.isFinite(savingRaw)) return null;
    out.extraMonthlySaving = normalizeZero(
      Math.min(MAX_AMOUNT, Math.max(0, Math.round(savingRaw)))
    );
  }

  const expenseRaw = readOwn(raw, 'extraMonthlyExpense');
  if (expenseRaw !== undefined) {
    if (typeof expenseRaw !== 'number' || !Number.isFinite(expenseRaw)) return null;
    out.extraMonthlyExpense = normalizeZero(
      Math.min(MAX_AMOUNT, Math.round(Math.abs(expenseRaw)))
    );
  }

  const cutRaw = readOwn(raw, 'variableSpendingCutPct');
  if (cutRaw !== undefined) {
    if (typeof cutRaw !== 'number' || !Number.isFinite(cutRaw)) return null;
    out.variableSpendingCutPct = normalizeZero(
      Math.min(100, Math.max(0, Math.round(cutRaw)))
    );
  }

  return out;
}

function parseCommonItemFields(
  raw: unknown,
  seenIds: Set<string>,
  nowMs: number
): Omit<FinanceItem, 'targetMonth'> | null {
  if (!isPlainObject(raw)) return null;

  const rawId = readOwn(raw, 'id');
  if (typeof rawId !== 'string') return null;
  const trimmedId = rawId.trim();
  if (trimmedId.length < 1 || trimmedId.length > 64) return null;

  let id = trimmedId;
  while (seenIds.has(id)) {
    id = generateId();
  }
  seenIds.add(id);

  const rawName = readOwn(raw, 'name');
  if (typeof rawName !== 'string') return null;
  const name = rawName.trim();
  if (name.length < 1 || name.length > 80) return null;

  const rawCategory = readOwn(raw, 'category');
  if (typeof rawCategory !== 'string' || !VALID_CATEGORIES.has(rawCategory)) return null;

  const totalAmount = parseIntAmount(readOwn(raw, 'totalAmount'), { required: true });
  const alreadySaved = parseIntAmount(readOwn(raw, 'alreadySaved'));
  if (totalAmount === null || alreadySaved === null) return null;

  const rawCreatedAt = readOwn(raw, 'createdAt');
  let createdAt = nowMs;
  if (rawCreatedAt !== undefined) {
    if (typeof rawCreatedAt !== 'number' || !Number.isFinite(rawCreatedAt) || rawCreatedAt < 0) {
      return null;
    }
    createdAt = rawCreatedAt;
  }

  return {
    id,
    name,
    category: rawCategory as ItemCategory,
    totalAmount,
    alreadySaved,
    createdAt,
  };
}

function parseTimestampNullable(value: unknown): number | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value;
}

function parseMeta(raw: unknown): StoredMeta | null {
  if (raw === undefined) return { lastExportAt: null };
  if (!isPlainObject(raw)) return null;
  const lastExportAt = parseTimestampNullable(readOwn(raw, 'lastExportAt'));
  if (lastExportAt === undefined) return null;
  return { lastExportAt };
}

export function createEmptyStoredData(now: Date = new Date()): StoredData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    baseline: {
      ...EMPTY_BASELINE,
      fixedBills: { ...EMPTY_BASELINE.fixedBills },
      variableBuckets: { ...EMPTY_BASELINE.variableBuckets },
    },
    items: [],
    whatIf: { ...EMPTY_WHAT_IF },
    balanceUpdatedAt: null,
    meta: { lastExportAt: null },
    updatedAt: now.getTime(),
  };
}

export function parseStoredData(input: unknown, now: Date = new Date()): ParseResult {
  if (!isPlainObject(input)) {
    return { ok: false, code: 'notObject', reason: 'Root value is not a plain object' };
  }

  const schemaVersion = readOwn(input, 'schemaVersion');
  if (
    typeof schemaVersion !== 'number' ||
    !Number.isInteger(schemaVersion) ||
    schemaVersion < 1
  ) {
    return { ok: false, code: 'invalidShape', reason: 'Invalid schemaVersion' };
  }

  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { ok: false, code: 'futureVersion', reason: 'Unsupported future schema version' };
  }

  const baseline = parseBaseline(readOwn(input, 'baseline'));
  if (!baseline) {
    return { ok: false, code: 'invalidShape', reason: 'Invalid baseline object' };
  }

  const rawItems = readOwn(input, 'items');
  if (!Array.isArray(rawItems) || rawItems.length > MAX_ITEMS) {
    return { ok: false, code: 'invalidShape', reason: 'Invalid items list' };
  }

  const whatIf = parseWhatIf(readOwn(input, 'whatIf'));
  if (!whatIf) {
    return { ok: false, code: 'invalidShape', reason: 'Invalid whatIf object' };
  }

  const nowMs = now.getTime();
  const rawUpdatedAt = readOwn(input, 'updatedAt');
  let updatedAt = nowMs;
  if (rawUpdatedAt !== undefined) {
    if (typeof rawUpdatedAt !== 'number' || !Number.isFinite(rawUpdatedAt) || rawUpdatedAt < 0) {
      return { ok: false, code: 'invalidShape', reason: 'Invalid updatedAt timestamp' };
    }
    updatedAt = rawUpdatedAt;
  }

  const seenIds = new Set<string>();

  if (schemaVersion === 1) {
    const v1Items: FinanceItem[] = [];
    for (const rawItem of rawItems) {
      const common = parseCommonItemFields(rawItem, seenIds, nowMs);
      if (!common) {
        return { ok: false, code: 'invalidShape', reason: 'Invalid v1 item fields' };
      }
      const rawTargetMonth = readOwn(rawItem as Record<string, unknown>, 'targetMonth');
      if (
        typeof rawTargetMonth !== 'number' ||
        !Number.isInteger(rawTargetMonth) ||
        rawTargetMonth < 0 ||
        rawTargetMonth > 120
      ) {
        return { ok: false, code: 'invalidShape', reason: 'Invalid v1 item targetMonth' };
      }
      v1Items.push({ ...common, targetMonth: rawTargetMonth });
    }

    const v1: StoredDataV1 = {
      schemaVersion: 1,
      baseline,
      items: v1Items,
      whatIf,
      updatedAt,
    };
    return { ok: true, data: runMigrations(v1, now), migratedFrom: 1 };
  }

  const v2Items: StoredItem[] = [];
  for (const rawItem of rawItems) {
    const common = parseCommonItemFields(rawItem, seenIds, nowMs);
    if (!common) {
      return { ok: false, code: 'invalidShape', reason: 'Invalid v2 item fields' };
    }
    const rawTargetDate = readOwn(rawItem as Record<string, unknown>, 'targetDate');
    if (!isValidYearMonth(rawTargetDate)) {
      return { ok: false, code: 'invalidShape', reason: 'Invalid v2 item targetDate' };
    }
    v2Items.push({ ...common, targetDate: rawTargetDate });
  }

  const balanceUpdatedAt = parseTimestampNullable(readOwn(input, 'balanceUpdatedAt'));
  if (balanceUpdatedAt === undefined) {
    return { ok: false, code: 'invalidShape', reason: 'Invalid balanceUpdatedAt timestamp' };
  }

  const meta = parseMeta(readOwn(input, 'meta'));
  if (!meta) {
    return { ok: false, code: 'invalidShape', reason: 'Invalid meta object' };
  }

  return {
    ok: true,
    data: {
      schemaVersion: 2,
      baseline,
      items: v2Items,
      whatIf,
      balanceUpdatedAt,
      meta,
      updatedAt,
    },
  };
}
