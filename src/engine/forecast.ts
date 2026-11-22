// DirHsabek — Pure Forecast Engine (Zero Dependencies)
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
} from '../types/finance';

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
 *     1. Goal: "Emergency Fund" — Total 24,000, Saved 6,000, Target month 6 (index 5)
 *     2. Debt: "Car Loan" — Total 30,000, Paid 12,000, Target month 10 (index 9)
 *     3. Shock: "Eid Expenses" — Total 8,000, Saved 2,000, Target month 3 (index 2)
 *
 * CALCULATIONS:
 *
 * Monthly free cashflow (baseline, no items):
 *   Income = 12,000 + 1,500 = 13,500
 *   Expenses = 5,300 + 4,200 = 9,500
 *   Free cashflow = 13,500 - 9,500 = 4,000 DH/month
 *
 * Item monthly slices (reserved each month until target):
 *   1. Emergency Fund: remaining = 24,000 - 6,000 = 18,000. monthsRemaining = 6 (indices 0-5).
 *      Monthly slice = 18,000 / 6 = 3,000 DH/month (reserved months 0-5)
 *   2. Car Loan: remaining = 30,000 - 12,000 = 18,000. monthsRemaining = 10 (indices 0-9).
 *      Monthly slice = 18,000 / 10 = 1,800 DH/month (reserved months 0-9)
 *   3. Eid Expenses: remaining = 8,000 - 2,000 = 6,000. monthsRemaining = 3 (indices 0-2).
 *      Monthly slice = 6,000 / 3 = 2,000 DH/month (reserved months 0-2)
 *
 * Total monthly reserved (months 0-2): 3,000 + 1,800 + 2,000 = 6,800 DH
 * Total monthly reserved (months 3-5): 3,000 + 1,800 = 4,800 DH
 * Total monthly reserved (months 6-9): 1,800 DH
 * Total monthly reserved (months 10-11): 0 DH
 *
 * NO DOUBLE-COUNTING RULE:
 * - Each month, reserved slices are deducted from free cashflow.
 * - When target month arrives, the item is "settled" using the accumulated reservations.
 * - The settlement amount is NOT subtracted again — it's already been reserved monthly.
 * - In the projection, we show the settlement as a visible event (itemSettlements) but
 *   the ending balance already accounts for it via the monthly reservations.
 *
 * Month-by-month projection (first 4 months):
 *
 * Month 0 (Current):
 *   Starting: 15,000
 *   Income: 13,500
 *   Fixed bills: 5,300
 *   Variable: 4,200
 *   Reserved: 6,800 (all 3 items)
 *   Free cashflow: 13,500 - 5,300 - 4,200 - 6,800 = -2,800
 *   Ending: 15,000 - 2,800 = 12,200
 *   Settlements: none
 *
 * Month 1:
 *   Starting: 12,200
 *   Income: 13,500
 *   Fixed: 5,300
 *   Variable: 4,200
 *   Reserved: 6,800
 *   Free cashflow: -2,800
 *   Ending: 9,400
 *   Settlements: none
 *
 * Month 2:
 *   Starting: 9,400
 *   Income: 13,500
 *   Fixed: 5,300
 *   Variable: 4,200
 *   Reserved: 6,800
 *   Free cashflow: -2,800
 *   Ending: 6,600
 *   Settlements: Eid Expenses (8,000) — wasReserved: true (2,000/mo × 3 = 6,000 reserved + 2,000 already saved)
 *   
 * Month 3 (Target for Eid):
 *   Starting: 6,600
 *   Income: 13,500
 *   Fixed: 5,300
 *   Variable: 4,200
 *   Reserved: 4,800 (Emergency + Car only)
 *   Free cashflow: 13,500 - 5,300 - 4,200 - 4,800 = -800
 *   Ending: 5,800
 *   Settlements: Eid Expenses — already settled in month 2, no double deduction
 *
 * ... continues to month 11
 *
 * Milestones:
 *   Month 4 (index 3): projected balance ~5,800
 *   Month 8 (index 7): projected balance depends on continued reservations
 *   Month 12 (index 11): final balance after all reservations end
 *
 * WHAT-IF SIMULATION:
 * - Takes baseline + whatIf adjustments
 * - Computes delta on monthly free cashflow
 * - Re-runs projection with adjusted numbers
 * - Original baseline data never mutated
 * ============================================================================
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function sumFixedBills(bills: FixedBills): number {
  return bills.rent + bills.utilities + bills.subscriptions + bills.other;
}

function sumVariableBuckets(buckets: VariableBuckets): number {
  return buckets.groceries + buckets.transport + buckets.leisure + buckets.other;
}

function applyWhatIfToBaseline(baseline: BaselineInput, whatIf: WhatIfScenario): BaselineInput {
  const adjusted = { ...baseline };
  
  if (whatIf.extraMonthlySaving) {
    adjusted.sideIncome = (adjusted.sideIncome || 0) + whatIf.extraMonthlySaving;
  }
  
  if (whatIf.extraMonthlyExpense) {
    adjusted.fixedBills = { ...adjusted.fixedBills, other: adjusted.fixedBills.other + whatIf.extraMonthlyExpense };
  }
  
  if (whatIf.variableSpendingCutPct && whatIf.variableSpendingCutPct > 0) {
    const cutFactor = 1 - whatIf.variableSpendingCutPct / 100;
    adjusted.variableBuckets = {
      groceries: Math.round(adjusted.variableBuckets.groceries * cutFactor),
      transport: Math.round(adjusted.variableBuckets.transport * cutFactor),
      leisure: Math.round(adjusted.variableBuckets.leisure * cutFactor),
      other: Math.round(adjusted.variableBuckets.other * cutFactor),
    };
  }
  
  return adjusted;
}

function getMonthLabel(monthIndex: number, baseDate: Date = new Date()): string {
  const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthIndex, 1);
  return date.toLocaleDateString('ar-MA', { month: 'long', year: 'numeric' });
}

function calculateItemProgress(item: FinanceItem, currentMonthIndex: number): ItemProgress {
  const remaining = Math.max(0, item.totalAmount - item.alreadySaved);
  const monthsRemaining = Math.max(1, item.targetMonth - currentMonthIndex);
  const monthlySlice = remaining / monthsRemaining;
  const progressPct = item.totalAmount > 0 ? Math.min(100, (item.alreadySaved / item.totalAmount) * 100) : 100;
  
  return {
    item,
    monthsRemaining,
    monthlySlice,
    progressPct,
    savedAmount: item.alreadySaved,
    remainingAmount: remaining,
  };
}

// ============================================================================
// CORE FORECAST FUNCTION
// ============================================================================

export function computeForecast(
  baseline: BaselineInput,
  items: FinanceItem[],
  whatIf: WhatIfScenario = {}
): ForecastResult {
  const adjustedBaseline = applyWhatIfToBaseline(baseline, whatIf);
  const fixedBillsTotal = sumFixedBills(adjustedBaseline.fixedBills);
  const variableTotal = sumVariableBuckets(adjustedBaseline.variableBuckets);
  const monthlyIncome = adjustedBaseline.fixedSalary + (adjustedBaseline.sideIncome || 0);
  
  // Pre-calculate monthly reserved amounts for each item across 12 months
  const monthlyReserved: number[] = new Array(12).fill(0);
  const itemSettlementsByMonth: ItemSettlement[][] = new Array(12).fill(null).map(() => []);
  
  for (const item of items) {
    const remaining = Math.max(0, item.totalAmount - item.alreadySaved);
    if (remaining <= 0) continue;
    
    const monthsRemaining = Math.max(1, item.targetMonth); // targetMonth is 0-indexed from current
    const monthlySlice = remaining / monthsRemaining;
    
    // Reserve monthly slice for each month up to (but not including) target month
    // The target month itself gets the settlement, not a reservation
    for (let m = 0; m < Math.min(monthsRemaining, 12); m++) {
      monthlyReserved[m] += monthlySlice;
    }
    
    // Record settlement at target month (if within 12-month horizon)
    if (item.targetMonth >= 0 && item.targetMonth < 12) {
      itemSettlementsByMonth[item.targetMonth].push({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        amount: item.totalAmount,
        wasReserved: true, // Because we reserved monthly slices leading up to it
      });
    }
  }
  
  // Build monthly projections
  const monthly: MonthlyProjection[] = [];
  let balance = adjustedBaseline.currentBalance;
  
  for (let m = 0; m < 12; m++) {
    const startingBalance = balance;
    const reservedThisMonth = monthlyReserved[m];
    const freeCashflow = monthlyIncome - fixedBillsTotal - variableTotal - reservedThisMonth;
    const endingBalance = startingBalance + freeCashflow;
    
    const isMilestone4 = m === 3;  // Month 4 = index 3
    const isMilestone8 = m === 7;  // Month 8 = index 7
    const isMilestone12 = m === 11; // Month 12 = index 11
    
    monthly.push({
      monthIndex: m,
      label: getMonthLabel(m),
      startingBalance,
      salary: adjustedBaseline.fixedSalary,
      sideIncome: adjustedBaseline.sideIncome || 0,
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
  
  // Milestone cards
  const milestones: MilestoneCard[] = [
    {
      month: 4,
      label: getMonthLabel(3),
      projectedBalance: monthly[3]?.endingBalance ?? 0,
      status: monthly[3]?.endingBalance ?? 0 > 0 ? 'surplus' : monthly[3]?.endingBalance ?? 0 < 0 ? 'deficit' : 'break-even',
      keyDrivers: buildKeyDrivers(monthly[3], items, 3),
    },
    {
      month: 8,
      label: getMonthLabel(7),
      projectedBalance: monthly[7]?.endingBalance ?? 0,
      status: monthly[7]?.endingBalance ?? 0 > 0 ? 'surplus' : monthly[7]?.endingBalance ?? 0 < 0 ? 'deficit' : 'break-even',
      keyDrivers: buildKeyDrivers(monthly[7], items, 7),
    },
    {
      month: 12,
      label: getMonthLabel(11),
      projectedBalance: monthly[11]?.endingBalance ?? 0,
      status: monthly[11]?.endingBalance ?? 0 > 0 ? 'surplus' : monthly[11]?.endingBalance ?? 0 < 0 ? 'deficit' : 'break-even',
      keyDrivers: buildKeyDrivers(monthly[11], items, 11),
    },
  ];
  
  // Item progress
  const itemProgress = items.map(item => calculateItemProgress(item, 0));
  
  // Summary
  const totalMonthlyReserved = monthlyReserved[0]; // First month reserved (highest typically)
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

function buildKeyDrivers(projection: MonthlyProjection | undefined, items: FinanceItem[], monthIndex: number): string[] {
  if (!projection) return ['لا بيانات'];
  
  const drivers: string[] = [];
  const activeItems = items.filter(item => item.targetMonth > monthIndex && item.totalAmount > item.alreadySaved);
  
  if (projection.freeCashflow < 0) {
    drivers.push(`عجز شهري: ${Math.abs(Math.round(projection.freeCashflow))} درهم`);
  } else {
    drivers.push(`فائض شهري: ${Math.round(projection.freeCashflow)} درهم`);
  }
  
  if (activeItems.length > 0) {
    const totalReserved = activeItems.reduce((sum, item) => {
      const remaining = Math.max(0, item.totalAmount - item.alreadySaved);
      const monthsLeft = Math.max(1, item.targetMonth - monthIndex);
      return sum + remaining / monthsLeft;
    }, 0);
    drivers.push(`محفوظ للأهداف/الديون: ${Math.round(totalReserved)} درهم/شهر`);
  }
  
  const settlingItems = items.filter(item => item.targetMonth === monthIndex);
  if (settlingItems.length > 0) {
    drivers.push(`تسوية: ${settlingItems.map(i => i.name).join('، ')}`);
  }
  
  return drivers.length > 0 ? drivers : ['مستقر'];
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
  whatIf: WhatIfScenario
): WhatIfDelta {
  const baselineResult = computeForecast(baseline, items, {});
  const scenarioResult = computeForecast(baseline, items, whatIf);
  
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
      month4: scenarioResult.milestones[0].projectedBalance - baselineResult.milestones[0].projectedBalance,
      month8: scenarioResult.milestones[1].projectedBalance - baselineResult.milestones[1].projectedBalance,
      month12: scenarioResult.milestones[2].projectedBalance - baselineResult.milestones[2].projectedBalance,
      averageFreeCashflow: scenarioResult.averageFreeCashflow - baselineResult.averageFreeCashflow,
      finalBalance: scenarioResult.finalBalanceMonth12 - baselineResult.finalBalanceMonth12,
      goalCompletionChanges,
    },
  };
}

// ============================================================================
// UTILITY: FORMAT CURRENCY
// ============================================================================

export function formatDH(amount: number): string {
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}