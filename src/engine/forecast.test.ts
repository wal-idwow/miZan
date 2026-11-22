import { describe, it, expect } from 'vitest';
import {
  computeForecast,
  computeWhatIfDelta,
  calculateItemProgress,
  calculateProgressRatio,
  applyWhatIfToBaseline,
  sumFixedBills,
  sumVariableBuckets,
  getMonthLabel,
  buildKeyDrivers,
  formatDH,
  formatPct,
} from './forecast';
import type {
  BaselineInput,
  FinanceItem,
  WhatIfScenario,
} from '../types/finance';

// ============================================================================
// FIXTURES
// ============================================================================

const mockBaseDate = new Date(2025, 0, 1); // January 2025

function createBaseline(overrides: Partial<BaselineInput> = {}): BaselineInput {
  return {
    fixedSalary: 12000,
    sideIncome: 1500,
    currentBalance: 15000,
    fixedBills: {
      rent: 4000,
      utilities: 800,
      subscriptions: 300,
      other: 200, // total = 5300
    },
    variableBuckets: {
      groceries: 2500,
      transport: 800,
      leisure: 600,
      other: 300, // total = 4200
    },
    ...overrides,
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('DirHsabek / miZan Pure Forecast Engine', () => {
  // --------------------------------------------------------------------------
  // 1. BASELINE CALCULATIONS & BILL/BUCKET SUMMERS
  // --------------------------------------------------------------------------
  describe('Baseline & Free Cashflow Calculations', () => {
    it('correctly sums fixed bills and variable buckets', () => {
      const baseline = createBaseline();
      expect(sumFixedBills(baseline.fixedBills)).toBe(5300);
      expect(sumVariableBuckets(baseline.variableBuckets)).toBe(4200);
    });

    it('calculates monthly free cashflow with no items', () => {
      const baseline = createBaseline();
      const result = computeForecast(baseline, [], {}, mockBaseDate);

      // Income = 12000 + 1500 = 13500
      // Expenses = 5300 + 4200 = 9500
      // Free cashflow = 13500 - 9500 = 4000
      expect(result.monthly).toHaveLength(12);
      for (const month of result.monthly) {
        expect(month.salary).toBe(12000);
        expect(month.sideIncome).toBe(1500);
        expect(month.fixedBillsTotal).toBe(5300);
        expect(month.variableTotal).toBe(4200);
        expect(month.reservedForItems).toBe(0);
        expect(month.freeCashflow).toBe(4000);
      }
      expect(result.averageFreeCashflow).toBe(4000);
    });

    it('chains starting and ending balance across all 12 months', () => {
      const baseline = createBaseline({ currentBalance: 10000 });
      const result = computeForecast(baseline, [], {}, mockBaseDate);

      let expectedStarting = 10000;
      for (let m = 0; m < 12; m++) {
        const month = result.monthly[m];
        expect(month.startingBalance).toBe(expectedStarting);
        expect(month.endingBalance).toBe(expectedStarting + month.freeCashflow);
        expectedStarting = month.endingBalance;
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. NORMAL SURPLUS SCENARIO
  // --------------------------------------------------------------------------
  describe('Normal Surplus Scenario', () => {
    it('correctly projects accumulating surplus and positive milestone cards', () => {
      const baseline = createBaseline({
        fixedSalary: 15000,
        sideIncome: 0,
        currentBalance: 20000,
        fixedBills: { rent: 4000, utilities: 600, subscriptions: 400, other: 0 }, // 5000
        variableBuckets: { groceries: 2000, transport: 500, leisure: 500, other: 0 }, // 3000
      });
      // Free cashflow = 15000 - 8000 = +7000 DH/month

      const result = computeForecast(baseline, [], {}, mockBaseDate);

      // Verify Month 4 milestone (index 3: months 0, 1, 2, 3 = 4 months)
      // 20000 + 4 * 7000 = 48000
      expect(result.milestones[0].month).toBe(4);
      expect(result.milestones[0].projectedBalance).toBe(48000);
      expect(result.milestones[0].status).toBe('surplus');

      // Month 8 milestone (index 7: 8 months)
      // 20000 + 8 * 7000 = 76000
      expect(result.milestones[1].month).toBe(8);
      expect(result.milestones[1].projectedBalance).toBe(76000);
      expect(result.milestones[1].status).toBe('surplus');

      // Month 12 milestone (index 11: 12 months)
      // 20000 + 12 * 7000 = 104000
      expect(result.milestones[2].month).toBe(12);
      expect(result.milestones[2].projectedBalance).toBe(104000);
      expect(result.milestones[2].status).toBe('surplus');
      expect(result.finalBalanceMonth12).toBe(104000);

      // Milestone key drivers include surplus driver
      expect(result.milestones[0].keyDrivers[0]).toContain('فائض شهري: 7000 درهم');
    });
  });

  // --------------------------------------------------------------------------
  // 3. DEFICIT WARNING SCENARIO
  // --------------------------------------------------------------------------
  describe('Deficit Warning Scenario', () => {
    it('detects monthly deficit, declining balance, and deficit status in milestones', () => {
      const baseline = createBaseline({
        fixedSalary: 7000,
        sideIncome: 0,
        currentBalance: 3000,
        fixedBills: { rent: 4500, utilities: 1000, subscriptions: 500, other: 500 }, // 6500
        variableBuckets: { groceries: 2500, transport: 500, leisure: 500, other: 500 }, // 4000
      });
      // Free cashflow = 7000 - 10500 = -3500 DH/month

      const result = computeForecast(baseline, [], {}, mockBaseDate);

      // Month 0 ending: 3000 - 3500 = -500 (already negative)
      expect(result.monthly[0].freeCashflow).toBe(-3500);
      expect(result.monthly[0].endingBalance).toBe(-500);

      // Month 4 (index 3): 3000 - (4 * 3500) = 3000 - 14000 = -11000
      expect(result.milestones[0].projectedBalance).toBe(-11000);
      expect(result.milestones[0].status).toBe('deficit');
      expect(result.milestones[0].keyDrivers[0]).toContain('عجز شهري: 3500 درهم');

      // Month 8 (index 7): 3000 - (8 * 3500) = -25000
      expect(result.milestones[1].projectedBalance).toBe(-25000);
      expect(result.milestones[1].status).toBe('deficit');

      // Month 12 (index 11): 3000 - (12 * 3500) = -39000
      expect(result.milestones[2].projectedBalance).toBe(-39000);
      expect(result.milestones[2].status).toBe('deficit');
      expect(result.finalBalanceMonth12).toBe(-39000);
    });

    it('correctly identifies break-even when balance is exactly 0', () => {
      const baseline = createBaseline({
        fixedSalary: 5000,
        sideIncome: 0,
        currentBalance: 0,
        fixedBills: { rent: 3000, utilities: 1000, subscriptions: 500, other: 500 }, // 5000
        variableBuckets: { groceries: 0, transport: 0, leisure: 0, other: 0 },
      });
      const result = computeForecast(baseline, [], {}, mockBaseDate);
      expect(result.milestones[0].projectedBalance).toBe(0);
      expect(result.milestones[0].status).toBe('break-even');
    });
  });

  // --------------------------------------------------------------------------
  // 4. IRREGULAR SIDE INCOME
  // --------------------------------------------------------------------------
  describe('Irregular Side Income', () => {
    it('side income increases monthly income, free cashflow, and final balance proportionally', () => {
      const baselineNoSide = createBaseline({ sideIncome: 0 });
      const baselineWithSide = createBaseline({ sideIncome: 2500 });

      const resNoSide = computeForecast(baselineNoSide, [], {}, mockBaseDate);
      const resWithSide = computeForecast(baselineWithSide, [], {}, mockBaseDate);

      // Free cashflow difference each month is exactly 2500 DH
      for (let m = 0; m < 12; m++) {
        expect(resWithSide.monthly[m].sideIncome).toBe(2500);
        expect(resWithSide.monthly[m].freeCashflow - resNoSide.monthly[m].freeCashflow).toBe(2500);
      }

      // Final balance difference after 12 months is 12 * 2500 = 30000 DH
      expect(resWithSide.finalBalanceMonth12 - resNoSide.finalBalanceMonth12).toBe(30000);
      expect(resWithSide.averageFreeCashflow - resNoSide.averageFreeCashflow).toBe(2500);
    });

    it('handles undefined or 0 sideIncome safely', () => {
      const baseline = createBaseline({ sideIncome: undefined as unknown as number });
      const result = computeForecast(baseline, [], {}, mockBaseDate);
      expect(result.monthly[0].sideIncome).toBe(0);
      expect(Number.isFinite(result.monthly[0].freeCashflow)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. DEBT / GOAL / SHOCK PROGRESS RATIOS
  // --------------------------------------------------------------------------
  describe('Debt, Goal & Shock Progress Calculations', () => {
    it('calculates progress ratios and remaining amounts correctly', () => {
      const goalItem: FinanceItem = {
        id: 'goal-1',
        name: 'Urgence',
        category: 'goal',
        totalAmount: 10000,
        alreadySaved: 2500,
        targetMonth: 5,
        createdAt: Date.now(),
      };

      const progress = calculateItemProgress(goalItem, 0);
      expect(progress.savedAmount).toBe(2500);
      expect(progress.remainingAmount).toBe(7500);
      expect(progress.progressPct).toBe(25); // 25%
      expect(calculateProgressRatio(goalItem)).toBe(0.25); // Green/red ratio = 0.25 green / 0.75 red
      expect(progress.monthsRemaining).toBe(5);
      expect(progress.monthlySlice).toBe(1500); // 7500 / 5
    });

    it('handles debt and shock categories identically in math', () => {
      const debtItem: FinanceItem = {
        id: 'debt-1',
        name: 'Crédit Auto',
        category: 'debt',
        totalAmount: 30000,
        alreadySaved: 12000,
        targetMonth: 10,
        createdAt: Date.now(),
      };
      const debtProgress = calculateItemProgress(debtItem, 0);
      expect(debtProgress.progressPct).toBe(40);
      expect(debtProgress.remainingAmount).toBe(18000);
      expect(debtProgress.monthlySlice).toBe(1800);

      const shockItem: FinanceItem = {
        id: 'shock-1',
        name: 'Eid Al-Adha',
        category: 'shock',
        totalAmount: 6000,
        alreadySaved: 3000,
        targetMonth: 3,
        createdAt: Date.now(),
      };
      const shockProgress = calculateItemProgress(shockItem, 0);
      expect(shockProgress.progressPct).toBe(50);
      expect(shockProgress.remainingAmount).toBe(3000);
      expect(shockProgress.monthlySlice).toBe(1000);
    });

    it('handles edge cases: 0 alreadySaved, 100% saved, over-saved, and zero totalAmount', () => {
      const zeroSaved: FinanceItem = {
        id: '1',
        name: 'Zero',
        category: 'goal',
        totalAmount: 5000,
        alreadySaved: 0,
        targetMonth: 5,
        createdAt: Date.now(),
      };
      expect(calculateItemProgress(zeroSaved, 0).progressPct).toBe(0);
      expect(calculateProgressRatio(zeroSaved)).toBe(0);

      const fullySaved: FinanceItem = {
        id: '2',
        name: 'Done',
        category: 'goal',
        totalAmount: 5000,
        alreadySaved: 5000,
        targetMonth: 5,
        createdAt: Date.now(),
      };
      expect(calculateItemProgress(fullySaved, 0).progressPct).toBe(100);
      expect(calculateItemProgress(fullySaved, 0).remainingAmount).toBe(0);
      expect(calculateItemProgress(fullySaved, 0).monthlySlice).toBe(0);

      const overSaved: FinanceItem = {
        id: '3',
        name: 'Over',
        category: 'goal',
        totalAmount: 5000,
        alreadySaved: 6000,
        targetMonth: 5,
        createdAt: Date.now(),
      };
      expect(calculateItemProgress(overSaved, 0).progressPct).toBe(100); // clamped to 100%
      expect(calculateItemProgress(overSaved, 0).remainingAmount).toBe(0);

      const zeroTotal: FinanceItem = {
        id: '4',
        name: 'ZeroTotal',
        category: 'goal',
        totalAmount: 0,
        alreadySaved: 0,
        targetMonth: 5,
        createdAt: Date.now(),
      };
      expect(calculateItemProgress(zeroTotal, 0).progressPct).toBe(100);
      expect(calculateProgressRatio(zeroTotal)).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 6. TARGET-MONTH SETTLEMENT & ZERO DOUBLE-COUNTING
  // --------------------------------------------------------------------------
  describe('Target-Month Settlement & Zero Double-Counting Rule', () => {
    it('reserves monthly slices up to target month, shows settlement, and performs NO duplicate deduction', () => {
      const baseline = createBaseline({
        fixedSalary: 10000,
        sideIncome: 0,
        currentBalance: 5000,
        fixedBills: { rent: 3000, utilities: 500, subscriptions: 0, other: 0 }, // 3500
        variableBuckets: { groceries: 1500, transport: 0, leisure: 0, other: 0 }, // 1500
      });
      // Monthly baseline net cashflow before reservations = 10000 - 5000 = 5000 DH/month

      const item: FinanceItem = {
        id: 'settle-item',
        name: 'MacBook Pro',
        category: 'goal',
        totalAmount: 12000,
        alreadySaved: 4000, // remaining = 8000
        targetMonth: 4,      // settles in month 4 (index 4)
        createdAt: Date.now(),
      };

      const result = computeForecast(baseline, [item], {}, mockBaseDate);

      // Months 0, 1, 2, 3 (4 months before settlement at month 4):
      // Monthly slice = 8000 / 4 = 2000 DH/month
      for (let m = 0; m < 4; m++) {
        expect(result.monthly[m].reservedForItems).toBe(2000);
        expect(result.monthly[m].freeCashflow).toBe(5000 - 2000); // 3000 DH
        expect(result.monthly[m].itemSettlements).toHaveLength(0);
      }

      // Month 4 (Target Month):
      // Settlement event occurs
      const month4 = result.monthly[4];
      expect(month4.itemSettlements).toHaveLength(1);
      expect(month4.itemSettlements[0]).toEqual({
        itemId: 'settle-item',
        itemName: 'MacBook Pro',
        category: 'goal',
        amount: 12000,
        wasReserved: true,
      });

      // CRITICAL: In Month 4, reservation drops to 0 for this item
      expect(month4.reservedForItems).toBe(0);

      // CRITICAL: Free cashflow in month 4 is full 5000 DH (10000 - 5000 bills - 0 reserved)
      expect(month4.freeCashflow).toBe(5000);

      // CRITICAL: ZERO DOUBLE-COUNTING ASSERTION:
      // Ending balance of month 4 is strictly startingBalance + freeCashflow.
      // The 12000 DH (or remaining 8000 DH) is NOT deducted again in month 4.
      expect(month4.endingBalance).toBe(month4.startingBalance + month4.freeCashflow);

      // Verify exact ending balance trajectory:
      // Start: 5000
      // Month 0: 5000 + 3000 = 8000
      // Month 1: 8000 + 3000 = 11000
      // Month 2: 11000 + 3000 = 14000
      // Month 3: 14000 + 3000 = 17000
      // Month 4: 17000 + 5000 = 22000 (settlement happened, no second deduction!)
      expect(result.monthly[0].endingBalance).toBe(8000);
      expect(result.monthly[1].endingBalance).toBe(11000);
      expect(result.monthly[2].endingBalance).toBe(14000);
      expect(result.monthly[3].endingBalance).toBe(17000);
      expect(result.monthly[4].endingBalance).toBe(22000);
    });
  });

  // --------------------------------------------------------------------------
  // 7. CRITICAL MATH TEST: MONTHLY SLICE INVARIANCE
  // --------------------------------------------------------------------------
  describe('CRITICAL MATH TEST: Monthly Slice Invariance (totalReserved === remainingAmount)', () => {
    it('proves that monthly slices do NOT inflate as targetMonth approaches, and sum of slices === remainingAmount', () => {
      const baseline = createBaseline();

      const item: FinanceItem = {
        id: 'car-savings',
        name: 'Dacia Sandero Apport',
        category: 'goal',
        totalAmount: 36000,
        alreadySaved: 12000,
        targetMonth: 6, // target month is month 6 (0-indexed)
        createdAt: Date.now(),
      };
      // Remaining = 36000 - 12000 = 24000
      // Target = 6 months (indices 0, 1, 2, 3, 4, 5)
      // Constant slice = 24000 / 6 = 4000 DH/month

      const result = computeForecast(baseline, [item], {}, mockBaseDate);

      const slicesBeforeSettlement: number[] = [];
      for (let m = 0; m < item.targetMonth; m++) {
        slicesBeforeSettlement.push(result.monthly[m].reservedForItems);
      }

      // Assert months before settlement has exactly 6 slices
      expect(slicesBeforeSettlement).toHaveLength(6);

      // Assert invariant slice across all pre-settlement months (NO inflation)
      expect(slicesBeforeSettlement[0]).toBe(4000);
      expect(slicesBeforeSettlement[1]).toBe(4000);
      expect(slicesBeforeSettlement[2]).toBe(4000);
      expect(slicesBeforeSettlement[3]).toBe(4000);
      expect(slicesBeforeSettlement[4]).toBe(4000);
      expect(slicesBeforeSettlement[5]).toBe(4000);

      // Verify every slice is strictly equal to the first slice
      for (let m = 1; m < item.targetMonth; m++) {
        expect(slicesBeforeSettlement[m]).toBe(slicesBeforeSettlement[0]);
      }

      // CRITICAL ASSERTION: Sum of monthly slices === totalAmount - alreadySaved
      const totalReservedSum = slicesBeforeSettlement.reduce((acc, val) => acc + val, 0);
      const remainingAmount = item.totalAmount - item.alreadySaved;

      expect(totalReservedSum).toBe(remainingAmount);
      expect(totalReservedSum).toBe(24000);

      // In month 6 (target month) and beyond, reservation for this item is 0
      for (let m = item.targetMonth; m < 12; m++) {
        expect(result.monthly[m].reservedForItems).toBe(0);
      }
    });

    it('handles non-integer division cleanly with floating point precision', () => {
      const baseline = createBaseline();
      const item: FinanceItem = {
        id: 'odd-item',
        name: 'Travel',
        category: 'goal',
        totalAmount: 10000,
        alreadySaved: 1000,
        targetMonth: 7, // 9000 / 7 = 1285.714285...
        createdAt: Date.now(),
      };

      const result = computeForecast(baseline, [item], {}, mockBaseDate);
      let sum = 0;
      for (let m = 0; m < 7; m++) {
        sum += result.monthly[m].reservedForItems;
      }
      expect(sum).toBeCloseTo(9000, 6);
    });

    it('accurately reproduces the multi-item worked numerical example from documentation', () => {
      const baseline = createBaseline({
        fixedSalary: 12000,
        sideIncome: 1500,
        currentBalance: 15000,
        fixedBills: { rent: 4000, utilities: 800, subscriptions: 300, other: 200 }, // 5300
        variableBuckets: { groceries: 2500, transport: 800, leisure: 600, other: 300 }, // 4200
      });

      const items: FinanceItem[] = [
        {
          id: '1',
          name: 'Emergency Fund',
          category: 'goal',
          totalAmount: 24000,
          alreadySaved: 6000, // remaining 18000
          targetMonth: 6,      // 3000/mo in months 0-5
          createdAt: 1,
        },
        {
          id: '2',
          name: 'Car Loan',
          category: 'debt',
          totalAmount: 30000,
          alreadySaved: 12000, // remaining 18000
          targetMonth: 10,     // 1800/mo in months 0-9
          createdAt: 2,
        },
        {
          id: '3',
          name: 'Eid Expenses',
          category: 'shock',
          totalAmount: 8000,
          alreadySaved: 2000, // remaining 6000
          targetMonth: 3,     // 2000/mo in months 0-2
          createdAt: 3,
        },
      ];

      const result = computeForecast(baseline, items, {}, mockBaseDate);

      // Verified reserved amounts:
      // Months 0-2: 3000 + 1800 + 2000 = 6800 DH
      expect(result.monthly[0].reservedForItems).toBe(6800);
      expect(result.monthly[1].reservedForItems).toBe(6800);
      expect(result.monthly[2].reservedForItems).toBe(6800);

      // Months 3-5: 3000 + 1800 = 4800 DH (Eid settled in month 3)
      expect(result.monthly[3].reservedForItems).toBe(4800);
      expect(result.monthly[4].reservedForItems).toBe(4800);
      expect(result.monthly[5].reservedForItems).toBe(4800);

      // Months 6-9: 1800 DH (Emergency Fund settled in month 6)
      expect(result.monthly[6].reservedForItems).toBe(1800);
      expect(result.monthly[7].reservedForItems).toBe(1800);
      expect(result.monthly[8].reservedForItems).toBe(1800);
      expect(result.monthly[9].reservedForItems).toBe(1800);

      // Months 10-11: 0 DH (Car Loan settled in month 10)
      expect(result.monthly[10].reservedForItems).toBe(0);
      expect(result.monthly[11].reservedForItems).toBe(0);

      // Check settlement placements:
      expect(result.monthly[3].itemSettlements).toHaveLength(1);
      expect(result.monthly[3].itemSettlements[0].itemName).toBe('Eid Expenses');

      expect(result.monthly[6].itemSettlements).toHaveLength(1);
      expect(result.monthly[6].itemSettlements[0].itemName).toBe('Emergency Fund');

      expect(result.monthly[10].itemSettlements).toHaveLength(1);
      expect(result.monthly[10].itemSettlements[0].itemName).toBe('Car Loan');

      // Check sum of all reservations for each item:
      // Eid: 2000 * 3 = 6000 (8000 - 2000)
      // Emergency: 3000 * 6 = 18000 (24000 - 6000)
      // Car: 1800 * 10 = 18000 (30000 - 12000)
      // Total sum of all reservations across 12 months = 6000 + 18000 + 18000 = 42000 DH
      const grandTotalReserved = result.monthly.reduce((sum, m) => sum + m.reservedForItems, 0);
      expect(grandTotalReserved).toBe(42000);
    });

    it('handles items beyond 12-month horizon (targetMonth >= 12)', () => {
      const baseline = createBaseline();
      const longTermItem: FinanceItem = {
        id: 'house-downpayment',
        name: 'House Downpayment',
        category: 'goal',
        totalAmount: 120000,
        alreadySaved: 0,
        targetMonth: 24, // 24 months
        createdAt: Date.now(),
      };
      // Monthly slice = 120000 / 24 = 5000 DH/month
      const result = computeForecast(baseline, [longTermItem], {}, mockBaseDate);

      // All 12 months in the window reserve 5000 DH
      for (let m = 0; m < 12; m++) {
        expect(result.monthly[m].reservedForItems).toBe(5000);
        expect(result.monthly[m].itemSettlements).toHaveLength(0); // not settled within 12 months
      }
    });
  });

  // --------------------------------------------------------------------------
  // 8. WHAT-IF SIMULATION ISOLATION & DELTA CALCULATOR
  // --------------------------------------------------------------------------
  describe('What-If Simulation Isolation & Delta Calculator', () => {
    it('strictly isolates simulation: original baseline object is NOT mutated', () => {
      const baseline = createBaseline({
        fixedSalary: 10000,
        sideIncome: 1000,
        currentBalance: 5000,
        fixedBills: { rent: 3000, utilities: 500, subscriptions: 200, other: 100 },
        variableBuckets: { groceries: 2000, transport: 500, leisure: 500, other: 200 },
      });

      // Snapshot baseline before running what-if
      const baselineSnapshot = JSON.parse(JSON.stringify(baseline));

      const whatIf: WhatIfScenario = {
        extraMonthlySaving: 1500,
        extraMonthlyExpense: 2000,
        variableSpendingCutPct: 20,
      };

      const delta = computeWhatIfDelta(baseline, [], whatIf, mockBaseDate);

      // Verify baseline was NOT mutated in any way
      expect(baseline).toEqual(baselineSnapshot);
      expect(delta.baselineResult.baseline).toEqual(baselineSnapshot);

      // Verify scenario received adjustments
      expect(delta.scenarioResult.baseline.sideIncome).toBe(1000 + 1500);
      expect(delta.scenarioResult.baseline.fixedBills.other).toBe(100 + 2000);
      expect(delta.scenarioResult.baseline.variableBuckets.groceries).toBe(Math.round(2000 * 0.8));
    });

    it('calculates what-if deltas correctly for extra monthly saving', () => {
      const baseline = createBaseline();
      const whatIf: WhatIfScenario = { extraMonthlySaving: 1000 };

      const delta = computeWhatIfDelta(baseline, [], whatIf, mockBaseDate);

      // Each month should have +1000 DH cashflow
      expect(delta.deltas.averageFreeCashflow).toBe(1000);

      // Month 4 balance delta = +4000 DH
      expect(delta.deltas.month4).toBe(4000);

      // Month 8 balance delta = +8000 DH
      expect(delta.deltas.month8).toBe(8000);

      // Month 12 balance delta = +12000 DH
      expect(delta.deltas.month12).toBe(12000);
      expect(delta.deltas.finalBalance).toBe(12000);
    });

    it('calculates what-if deltas for extra expense and spending cut', () => {
      const baseline = createBaseline({
        variableBuckets: { groceries: 2000, transport: 1000, leisure: 500, other: 500 }, // 4000
      });
      // 10% cut on variable buckets = -400 DH spending
      const whatIfCut: WhatIfScenario = { variableSpendingCutPct: 10 };
      const deltaCut = computeWhatIfDelta(baseline, [], whatIfCut, mockBaseDate);

      expect(deltaCut.deltas.averageFreeCashflow).toBe(400);
      expect(deltaCut.deltas.finalBalance).toBe(4800);

      // Extra monthly expense of 1000 DH
      const whatIfExpense: WhatIfScenario = { extraMonthlyExpense: 1000 };
      const deltaExpense = computeWhatIfDelta(baseline, [], whatIfExpense, mockBaseDate);

      expect(deltaExpense.deltas.averageFreeCashflow).toBe(-1000);
      expect(deltaExpense.deltas.finalBalance).toBe(-12000);
    });

    it('tracks goal completion changes in WhatIfDelta', () => {
      const baseline = createBaseline();
      const item: FinanceItem = {
        id: 'goal-x',
        name: 'Voyage',
        category: 'goal',
        totalAmount: 10000,
        alreadySaved: 3000,
        targetMonth: 5,
        createdAt: Date.now(),
      };

      const delta = computeWhatIfDelta(baseline, [item], { extraMonthlySaving: 500 }, mockBaseDate);
      expect(delta.deltas.goalCompletionChanges).toHaveLength(1);
      expect(delta.deltas.goalCompletionChanges[0].itemId).toBe('goal-x');
      expect(delta.deltas.goalCompletionChanges[0].baselinePct).toBe(30);
      expect(delta.deltas.goalCompletionChanges[0].scenarioPct).toBe(30);
    });
  });

  // --------------------------------------------------------------------------
  // 9. 12-MONTH ROLLING PROJECTION & 4/8/12 MILESTONES
  // --------------------------------------------------------------------------
  describe('12-Month Projection & 4/8/12 Milestone Extraction', () => {
    it('produces exactly 12 months with milestone markers at indices 3, 7, and 11', () => {
      const baseline = createBaseline();
      const result = computeForecast(baseline, [], {}, mockBaseDate);

      expect(result.monthly).toHaveLength(12);

      // Month indices
      for (let i = 0; i < 12; i++) {
        expect(result.monthly[i].monthIndex).toBe(i);
        expect(typeof result.monthly[i].label).toBe('string');
      }

      // Check milestone flags
      expect(result.monthly[3].isMilestone4).toBe(true);
      expect(result.monthly[3].isMilestone8).toBe(false);
      expect(result.monthly[3].isMilestone12).toBe(false);

      expect(result.monthly[7].isMilestone4).toBe(false);
      expect(result.monthly[7].isMilestone8).toBe(true);
      expect(result.monthly[7].isMilestone12).toBe(false);

      expect(result.monthly[11].isMilestone4).toBe(false);
      expect(result.monthly[11].isMilestone8).toBe(false);
      expect(result.monthly[11].isMilestone12).toBe(true);

      // Milestone cards match monthly projection ending balances
      expect(result.milestones[0].month).toBe(4);
      expect(result.milestones[0].projectedBalance).toBe(result.monthly[3].endingBalance);

      expect(result.milestones[1].month).toBe(8);
      expect(result.milestones[1].projectedBalance).toBe(result.monthly[7].endingBalance);

      expect(result.milestones[2].month).toBe(12);
      expect(result.milestones[2].projectedBalance).toBe(result.monthly[11].endingBalance);
    });

    it('getMonthLabel formats month and year in Arabic Moroccan locale', () => {
      const label0 = getMonthLabel(0, mockBaseDate);
      expect(label0).toBe('يناير 2025');
      const label1 = getMonthLabel(1, mockBaseDate);
      expect(label1).toBe('فبراير 2025');
    });

    it('applyWhatIfToBaseline correctly modifies copied values while preserving original', () => {
      const baseline = createBaseline({ sideIncome: 1000 });
      const adjusted = applyWhatIfToBaseline(baseline, {
        extraMonthlySaving: 500,
        extraMonthlyExpense: 300,
        variableSpendingCutPct: 10,
      });
      expect(adjusted.sideIncome).toBe(1500);
      expect(adjusted.fixedBills.other).toBe(baseline.fixedBills.other + 300);
      expect(baseline.sideIncome).toBe(1000);
    });

    it('buildKeyDrivers handles undefined and empty states gracefully', () => {
      expect(buildKeyDrivers(undefined, [], 0)).toEqual(['لا بيانات']);
    });
  });

  // --------------------------------------------------------------------------
  // 10. FORMATTING UTILITIES
  // --------------------------------------------------------------------------
  describe('Formatting Utilities', () => {
    it('formatDH formats currency with MAD symbol in Arabic locale', () => {
      const formatted = formatDH(5000);
      expect(formatted).toContain('5.000');
      expect(formatted).toContain('د.م.');
    });

    it('formatPct formats numbers to percentage string', () => {
      expect(formatPct(45.6)).toBe('46%');
      expect(formatPct(100)).toBe('100%');
      expect(formatPct(0)).toBe('0%');
    });
  });
});
