// miZan — Pure Forecast Engine (Zero Dependencies)
// All calculations in MAD (DH). Months are 0-indexed from current month.

import type {
  BaselineInput,
  FinanceItem,
  WhatIfScenario,
  MonthlyProjection,
  MilestoneCard,
  ItemProgress,
  ForecastResult,
  ItemSettlement,
  FixedBills,
  VariableBuckets,
  KeyDriverFact,
} from '../types/finance';

export { formatDH, formatPct } from '../utils/format';

/**
 * ============================================================================
 * FORECASTING MATH — WORKED NUMERICAL EXAMPLE
 * ============================================================================
 *
 * SCENARIO (Baseline):
 * - Current balance: 15,000 DH
 * - Fixed salary: 12,000 DH/month
 * - Side income: 1,500 DH/month (average)
 * - Fixed bills: Rent 4,000 + Utilities 800 + Subscriptions 300 + Other 200 = 5,300 DH
 * - Variable buckets: Groceries 2,500 + Transport 800 + Leisure 600 + Other 300 = 4,200 DH
 * - Items:
 *     1. Goal: "Emergency Fund" — Total 24,000, Saved 6,000, Target month 6
 *     2. Debt: "Car Loan" — Total 30,000, Paid 12,000, Target month 10
 *     3. Shock: "Eid Expenses" — Total 8,000, Saved 2,000, Target month 3
 *
 * CALCULATIONS:
 *
 * Monthly free cashflow (baseline, no items):
 *   Income = 12,000 + 1,500 = 13,500
 *   Expenses = 5,300 + 4,200 = 9,500
 *   Free cashflow = 13,500 - 9,500 = 4,000 DH/month
 *
 * Item monthly slices (reserved each month until target month):
 *   1. Emergency Fund: remaining = 24,000 - 6,000 = 18,000. Target month 6 -> 6 months (0-5).
 *      Monthly slice = 18,000 / 6 = 3,000 DH/month (reserved months 0-5)
 *   2. Car Loan: remaining = 30,000 - 12,000 = 18,000. Target month 10 -> 10 months (0-9).
 *      Monthly slice = 18,000 / 10 = 1,800 DH/month (reserved months 0-9)
 *   3. Eid Expenses: remaining = 8,000 - 2,000 = 6,000. Target month 3 -> 3 months (0-2).
 *      Monthly slice = 6,000 / 3 = 2,000 DH/month (reserved months 0-2)
 *
 * Total monthly reserved:
 *   Months 0-2: 3,000 + 1,800 + 2,000 = 6,800 DH
 *   Months 3-5: 3,000 + 1,800 = 4,800 DH (Eid settled in month 3, reservations stop)
 *   Months 6-9: 1,800 DH (Emergency Fund settled in month 6, reservations stop)
 *   Months 10-11: 0 DH (Car Loan settled in month 10, reservations stop)
 *
 * NO DOUBLE-COUNTING RULE:
 * - Each month before targetMonth, reserved slices are deducted from free cashflow.
 * - When target month arrives, the item is "settled" using accumulated reservations.
 * - The settlement amount is NOT subtracted again — it has already been reserved monthly.
 * - In the projection, settlement is shown as a visible event (itemSettlements) with wasReserved=true,
 *   and no duplicate deduction is made in the target month.
 *
 * SLICE INVARIANCE:
 * - The monthly slice for an item is invariant across all months before settlement:
 *   sum(monthlySlice for m = 0..targetMonth-1) === totalAmount - alreadySaved.
 *   Slices do NOT inflate as targetMonth approaches.
 * ============================================================================
 */

// ============================================================================
// HELPER FUNCTIONS & GUARDS
// ============================================================================

function safeNum(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeTargetMonth(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }
  return 12;
}

export function sumFixedBills(bills: FixedBills): number {
  return (
    safeNum(bills.rent) +
    safeNum(bills.utilities) +
    safeNum(bills.subscriptions) +
    safeNum(bills.other)
  );
}

export function sumVariableBuckets(buckets: VariableBuckets): number {
  return (
    safeNum(buckets.groceries) +
    safeNum(buckets.transport) +
    safeNum(buckets.leisure) +
    safeNum(buckets.other)
  );
}

/**
 * Creates an isolated copy of baseline with what-if scenario modifications applied.
 * Original baseline is never mutated.
 */
export function applyWhatIfToBaseline(
  baseline: BaselineInput,
  whatIf: WhatIfScenario = {}
): BaselineInput {
  const adjusted: BaselineInput = {
    fixedSalary: safeNum(baseline.fixedSalary),
    sideIncome: safeNum(baseline.sideIncome),
    currentBalance: safeNum(baseline.currentBalance),
    fixedBills: {
      rent: safeNum(baseline.fixedBills.rent),
      utilities: safeNum(baseline.fixedBills.utilities),
      subscriptions: safeNum(baseline.fixedBills.subscriptions),
      other: safeNum(baseline.fixedBills.other),
    },
    variableBuckets: {
      groceries: safeNum(baseline.variableBuckets.groceries),
      transport: safeNum(baseline.variableBuckets.transport),
      leisure: safeNum(baseline.variableBuckets.leisure),
      other: safeNum(baseline.variableBuckets.other),
    },
  };

  if (whatIf.extraMonthlySaving !== undefined) {
    adjusted.sideIncome += Math.max(0, safeNum(whatIf.extraMonthlySaving));
  }

  if (whatIf.extraMonthlyExpense !== undefined) {
    const extraExpense = safeNum(whatIf.extraMonthlyExpense);
    if (extraExpense !== 0) {
      adjusted.fixedBills.other += Math.abs(extraExpense);
    }
  }

  if (whatIf.variableSpendingCutPct !== undefined) {
    const clampedCutPct = Math.min(100, Math.max(0, safeNum(whatIf.variableSpendingCutPct)));
    if (clampedCutPct > 0) {
      const cutFactor = 1 - clampedCutPct / 100;
      adjusted.variableBuckets = {
        groceries: Math.round(adjusted.variableBuckets.groceries * cutFactor),
        transport: Math.round(adjusted.variableBuckets.transport * cutFactor),
        leisure: Math.round(adjusted.variableBuckets.leisure * cutFactor),
        other: Math.round(adjusted.variableBuckets.other * cutFactor),
      };
    }
  }

  return adjusted;
}

export function getMonthLabel(monthIndex: number, baseDate: Date = new Date()): string {
  const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthIndex, 1);
  return date.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' });
}

/**
 * Calculates item progress and ratio for green/red visualization.
 * Green ratio = alreadySaved / totalAmount
 * Red ratio = remainingAmount / totalAmount
 */
export function calculateItemProgress(
  item: FinanceItem,
  currentMonthIndex: number = 0
): ItemProgress {
  const totalAmount = Math.max(0, safeNum(item.totalAmount));
  const alreadySaved = Math.max(0, safeNum(item.alreadySaved));
  const remaining = Math.max(0, totalAmount - alreadySaved);
  const normalizedTarget = normalizeTargetMonth(item.targetMonth);
  const safeCurrentMonth = Number.isFinite(currentMonthIndex)
    ? Math.floor(currentMonthIndex)
    : 0;
  const rawMonthsDiff = normalizedTarget - safeCurrentMonth;
  const isOverdue = remaining > 0 && rawMonthsDiff <= 0;
  const monthsRemaining =
    isOverdue || (remaining <= 0 && rawMonthsDiff <= 0)
      ? 0
      : Math.max(1, rawMonthsDiff);
  const monthlySlice =
    remaining === 0 ? 0 : remaining / Math.max(1, monthsRemaining);
  const progressPct =
    totalAmount > 0
      ? Math.min(100, Math.max(0, (alreadySaved / totalAmount) * 100))
      : 100;

  return {
    item,
    monthsRemaining,
    monthlySlice,
    progressPct,
    savedAmount: alreadySaved,
    remainingAmount: remaining,
    isOverdue,
  };
}

export function calculateProgressRatio(item: FinanceItem): number {
  const totalAmount = safeNum(item.totalAmount);
  const alreadySaved = safeNum(item.alreadySaved);
  if (totalAmount <= 0) return 1;
  return Math.min(1, Math.max(0, alreadySaved / totalAmount));
}

function getMilestoneStatus(balance: number): 'surplus' | 'deficit' | 'break-even' {
  const rounded = Math.round(safeNum(balance));
  if (rounded > 0) return 'surplus';
  if (rounded < 0) return 'deficit';
  return 'break-even';
}

export function buildKeyDriverFacts(
  projection: MonthlyProjection | undefined,
  items: FinanceItem[],
  monthIndex: number
): KeyDriverFact[] {
  if (!projection) return [{ kind: 'noData' }];

  const facts: KeyDriverFact[] = [];

  if (projection.freeCashflow < 0) {
    facts.push({ kind: 'deficit', amount: Math.abs(Math.round(projection.freeCashflow)) });
  } else {
    facts.push({ kind: 'surplus', amount: Math.round(projection.freeCashflow) });
  }

  if (projection.reservedForItems > 0) {
    facts.push({ kind: 'reserved', amount: Math.round(projection.reservedForItems) });
  }

  const settlingItems = items.filter(
    item => normalizeTargetMonth(item.targetMonth) === monthIndex
  );
  if (settlingItems.length > 0) {
    facts.push({ kind: 'settling', names: settlingItems.map(i => i.name) });
  }

  return facts.length > 0 ? facts : [{ kind: 'stable' }];
}

export function buildKeyDrivers(
  projection: MonthlyProjection | undefined,
  items: FinanceItem[],
  monthIndex: number
): string[] {
  const facts = buildKeyDriverFacts(projection, items, monthIndex);
  return facts.map(fact => {
    switch (fact.kind) {
      case 'noData':
        return 'لا بيانات';
      case 'deficit':
        return `عجز شهري: ${fact.amount} درهم`;
      case 'surplus':
        return `فائض شهري: ${fact.amount} درهم`;
      case 'reserved':
        return `محفوظ للأهداف/الديون: ${fact.amount} درهم/شهر`;
      case 'settling':
        return `تسوية: ${fact.names.join('، ')}`;
      case 'stable':
        return 'مستقر';
    }
  });
}

// ============================================================================
// CORE FORECAST FUNCTION
// ============================================================================

export function computeForecast(
  baseline: BaselineInput,
  items: FinanceItem[],
  whatIf: WhatIfScenario = {},
  baseDate: Date = new Date()
): ForecastResult {
  const adjustedBaseline = applyWhatIfToBaseline(baseline, whatIf);
  const fixedBillsTotal = sumFixedBills(adjustedBaseline.fixedBills);
  const variableTotal = sumVariableBuckets(adjustedBaseline.variableBuckets);
  const monthlyIncome = adjustedBaseline.fixedSalary + adjustedBaseline.sideIncome;

  // Pre-calculate monthly reserved amounts and overdue Month-0 settlements across 12 months
  const monthlyReserved: number[] = new Array(12).fill(0);
  const itemSettlementsByMonth: ItemSettlement[][] = Array.from({ length: 12 }, () => []);
  let immediateDueMonth0 = 0;

  for (const item of items) {
    const totalAmount = Math.max(0, safeNum(item.totalAmount));
    const alreadySaved = Math.max(0, safeNum(item.alreadySaved));
    const remaining = Math.max(0, totalAmount - alreadySaved);
    const targetMonth = normalizeTargetMonth(item.targetMonth);

    if (remaining <= 0) {
      // Fully funded item: record settlement if targetMonth falls within 12-month horizon
      if (targetMonth >= 0 && targetMonth < 12) {
        itemSettlementsByMonth[targetMonth].push({
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          amount: totalAmount,
          wasReserved: true,
        });
      }
      continue;
    }

    if (targetMonth <= 0) {
      // Guard G3: overdue or due-this-month unpaid balance settles immediately in month 0
      immediateDueMonth0 += remaining;
      itemSettlementsByMonth[0].push({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        amount: remaining,
        wasReserved: false,
      });
      continue;
    }

    // targetMonth >= 1: reserve constant monthly slice across all months before settlement
    const monthsRemaining = targetMonth;
    const monthlySlice = remaining / monthsRemaining;

    // Reserve monthly slice for each month up to (but NOT including) target month
    // Slices are invariant and do NOT inflate as targetMonth approaches
    const reserveUntil = Math.min(monthsRemaining, 12);
    for (let m = 0; m < reserveUntil; m++) {
      monthlyReserved[m] += monthlySlice;
    }

    // Settlement occurs at target month (if within 12-month horizon)
    if (targetMonth < 12) {
      itemSettlementsByMonth[targetMonth].push({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        amount: totalAmount,
        wasReserved: true, // Fully covered by prior monthly reservations
      });
    }
  }

  // Build 12-month rolling projections
  const monthly: MonthlyProjection[] = [];
  let balance = adjustedBaseline.currentBalance;

  for (let m = 0; m < 12; m++) {
    const startingBalance = balance;
    const reservedThisMonth = monthlyReserved[m];
    const immediateDueThisMonth = m === 0 ? immediateDueMonth0 : 0;
    const freeCashflow =
      monthlyIncome - fixedBillsTotal - variableTotal - reservedThisMonth - immediateDueThisMonth;
    const endingBalance = startingBalance + freeCashflow;

    const isMilestone4 = m === 3; // Month 4 = index 3
    const isMilestone8 = m === 7; // Month 8 = index 7
    const isMilestone12 = m === 11; // Month 12 = index 11

    monthly.push({
      monthIndex: m,
      label: getMonthLabel(m, baseDate),
      startingBalance,
      salary: adjustedBaseline.fixedSalary,
      sideIncome: adjustedBaseline.sideIncome,
      fixedBillsTotal,
      variableTotal,
      reservedForItems: reservedThisMonth,
      freeCashflow,
      endingBalance,
      isMilestone4,
      isMilestone8,
      isMilestone12,
      itemSettlements: itemSettlementsByMonth[m] || [],
    });

    balance = endingBalance;
  }

  // Milestone cards: 4, 8, 12 months
  const balance4 = monthly[3]?.endingBalance ?? 0;
  const balance8 = monthly[7]?.endingBalance ?? 0;
  const balance12 = monthly[11]?.endingBalance ?? 0;

  const milestones: MilestoneCard[] = [
    {
      month: 4,
      label: getMonthLabel(3, baseDate),
      projectedBalance: balance4,
      status: getMilestoneStatus(balance4),
      keyDrivers: buildKeyDrivers(monthly[3], items, 3),
      driverFacts: buildKeyDriverFacts(monthly[3], items, 3),
    },
    {
      month: 8,
      label: getMonthLabel(7, baseDate),
      projectedBalance: balance8,
      status: getMilestoneStatus(balance8),
      keyDrivers: buildKeyDrivers(monthly[7], items, 7),
      driverFacts: buildKeyDriverFacts(monthly[7], items, 7),
    },
    {
      month: 12,
      label: getMonthLabel(11, baseDate),
      projectedBalance: balance12,
      status: getMilestoneStatus(balance12),
      keyDrivers: buildKeyDrivers(monthly[11], items, 11),
      driverFacts: buildKeyDriverFacts(monthly[11], items, 11),
    },
  ];

  // Item progress
  const itemProgress = items.map(item => calculateItemProgress(item, 0));

  // Summary
  const totalMonthlyReserved = monthlyReserved[0];
  const averageFreeCashflow = monthly.reduce((sum, m) => sum + m.freeCashflow, 0) / 12;
  const finalBalanceMonth12 = monthly[11]?.endingBalance ?? 0;

  return {
    baseline: adjustedBaseline,
    whatIf,
    monthly,
    milestones,
    itemProgress,
    totalMonthlyReserved,
    averageFreeCashflow,
    finalBalanceMonth12,
  };
}

// ============================================================================
// WHAT-IF DELTA CALCULATOR
// ============================================================================

export interface WhatIfDelta {
  baselineResult: ForecastResult;
  scenarioResult: ForecastResult;
  deltas: {
    month4: number;
    month8: number;
    month12: number;
    averageFreeCashflow: number;
    finalBalance: number;
    goalCompletionChanges: { itemId: string; baselinePct: number; scenarioPct: number }[];
  };
}

export function computeWhatIfDelta(
  baseline: BaselineInput,
  items: FinanceItem[],
  whatIf: WhatIfScenario,
  baseDate: Date = new Date()
): WhatIfDelta {
  // Run baseline and scenario forecasts with isolation
  const baselineResult = computeForecast(baseline, items, {}, baseDate);
  const scenarioResult = computeForecast(baseline, items, whatIf, baseDate);

  const goalCompletionChanges = items.map(item => {
    const baselineProgress = baselineResult.itemProgress.find(p => p.item.id === item.id);
    const scenarioProgress = scenarioResult.itemProgress.find(p => p.item.id === item.id);
    return {
      itemId: item.id,
      baselinePct: baselineProgress?.progressPct ?? 0,
      scenarioPct: scenarioProgress?.progressPct ?? 0,
    };
  });

  return {
    baselineResult,
    scenarioResult,
    deltas: {
      month4:
        scenarioResult.milestones[0].projectedBalance -
        baselineResult.milestones[0].projectedBalance,
      month8:
        scenarioResult.milestones[1].projectedBalance -
        baselineResult.milestones[1].projectedBalance,
      month12:
        scenarioResult.milestones[2].projectedBalance -
        baselineResult.milestones[2].projectedBalance,
      averageFreeCashflow:
        scenarioResult.averageFreeCashflow - baselineResult.averageFreeCashflow,
      finalBalance:
        scenarioResult.finalBalanceMonth12 - baselineResult.finalBalanceMonth12,
      goalCompletionChanges,
    },
  };
}
