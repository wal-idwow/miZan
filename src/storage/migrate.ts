// miZan — Schema Migration Pipeline
import { addMonthsToYearMonth } from '../utils/dates';
import {
  CURRENT_SCHEMA_VERSION,
  type StoredData,
  type StoredDataV1,
  type StoredItem,
} from '../types/finance';

export function migrateV1ToV2(v1: StoredDataV1, now: Date = new Date()): StoredData {
  const items: StoredItem[] = v1.items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    totalAmount: item.totalAmount,
    alreadySaved: item.alreadySaved,
    targetDate: addMonthsToYearMonth(now, item.targetMonth),
    createdAt: item.createdAt,
  }));

  const updatedAt = Number.isFinite(v1.updatedAt) ? v1.updatedAt : now.getTime();

  return {
    schemaVersion: 2,
    baseline: v1.baseline,
    items,
    whatIf: v1.whatIf,
    balanceUpdatedAt: updatedAt,
    meta: { lastExportAt: null },
    updatedAt,
  };
}

export const migrations: Record<number, (data: unknown, now: Date) => unknown> = {
  1: (data, now) => migrateV1ToV2(data as StoredDataV1, now),
};

export function runMigrations(
  data: { schemaVersion: number },
  now: Date = new Date()
): StoredData {
  let current: { schemaVersion: number } = data;
  while (current.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migrateFn = migrations[current.schemaVersion];
    if (!migrateFn) {
      throw new Error(`Missing migration from schemaVersion ${current.schemaVersion}`);
    }
    current = migrateFn(current, now) as { schemaVersion: number };
  }
  return current as StoredData;
}
