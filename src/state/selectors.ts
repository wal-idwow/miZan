// miZan — State Selectors (Engine boundary & strict baseline/scenario isolation)
import {
  computeForecast,
  computeWhatIfDelta,
  type WhatIfDelta,
} from '../engine/forecast';
import { monthsBetween } from '../utils/dates';
import {
  EMPTY_WHAT_IF,
  type BaselineInput,
  type FinanceItem,
  type ForecastResult,
  type StoredItem,
  type WhatIfScenario,
} from '../types/finance';

export function toEngineItems(
  items: StoredItem[],
  baseDate: Date = new Date()
): FinanceItem[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    totalAmount: item.totalAmount,
    alreadySaved: item.alreadySaved,
    targetMonth: monthsBetween(baseDate, item.targetDate),
    createdAt: item.createdAt,
  }));
}

export function hasActiveWhatIf(whatIf: WhatIfScenario): boolean {
  return (
    (whatIf.extraMonthlySaving ?? 0) > 0 ||
    (whatIf.extraMonthlyExpense ?? 0) !== 0 ||
    (whatIf.variableSpendingCutPct ?? 0) > 0
  );
}

/**
 * Always computes the real baseline forecast (never influenced by persisted What-If).
 */
export function selectBaselineForecast(
  baseline: BaselineInput,
  items: StoredItem[],
  baseDate: Date = new Date()
): ForecastResult {
  return computeForecast(baseline, toEngineItems(items, baseDate), EMPTY_WHAT_IF, baseDate);
}

/**
 * Computes scenario delta only when an adjustment is active.
 */
export function selectWhatIfDelta(
  baseline: BaselineInput,
  items: StoredItem[],
  whatIf: WhatIfScenario,
  baseDate: Date = new Date()
): WhatIfDelta | null {
  if (!hasActiveWhatIf(whatIf)) return null;
  return computeWhatIfDelta(baseline, toEngineItems(items, baseDate), whatIf, baseDate);
}

export function selectMonthlyFreeCashflow(forecast: ForecastResult): number {
  return forecast.monthly[0]?.freeCashflow ?? 0;
}
