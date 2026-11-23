import { describe, it, expect } from 'vitest';
import {
  applyWhatIfToBaseline,
  buildKeyDriverFacts,
  calculateItemProgress,
  computeForecast,
} from './forecast';
import type { BaselineInput, FinanceItem } from '../types/finance';

const baseDate = new Date(2026, 10, 1); // Nov 2026

function createBaseline(overrides: Partial<BaselineInput> = {}): BaselineInput {
  return {
    fixedSalary: 10000,
    sideIncome: 0,
    currentBalance: 5000,
    fixedBills: { rent: 3000, utilities: 500, subscriptions: 0, other: 0 },
    variableBuckets: { groceries: 1500, transport: 0, leisure: 0, other: 0 },
    ...overrides,
  };
}

describe('Forecast Engine Guards (G1–G6)', () => {
  it('G1: floors fractional targetMonth and guards NaN/Infinity targetMonth without throwing', () => {
    const baseline = createBaseline();
    const fractionalItem: FinanceItem = {
      id: 'frac-1',
      name: 'Fractional',
      category: 'goal',
      totalAmount: 4000,
      alreadySaved: 0,
      targetMonth: 2.5,
      createdAt: 1,
    };
    const nanItem: FinanceItem = {
      id: 'nan-1',
      name: 'NaNTarget',
      category: 'goal',
      totalAmount: 1200,
      alreadySaved: 0,
      targetMonth: Number.NaN,
      createdAt: 2,
    };

    const res = computeForecast(baseline, [fractionalItem, nanItem], {}, baseDate);
    expect(Number.isFinite(res.finalBalanceMonth12)).toBe(true);
    // fractionalItem floors to targetMonth=2 -> 2000/mo in months 0,1 + nanItem falls back to 12 -> 100/mo
    expect(res.monthly[0].reservedForItems).toBe(2100);
    expect(res.monthly[2].itemSettlements.some(s => s.itemId === 'frac-1')).toBe(true);
  });

  it('G2: sanitizes NaN and Infinity numbers in baseline and items', () => {
    const baseline = createBaseline({
      sideIncome: Number.NaN,
      currentBalance: Number.POSITIVE_INFINITY,
      fixedBills: { rent: 3000, utilities: Number.NaN, subscriptions: 0, other: 0 },
    });
    const item: FinanceItem = {
      id: 'bad-num',
      name: 'BadNum',
      category: 'goal',
      totalAmount: Number.NaN,
      alreadySaved: Number.POSITIVE_INFINITY,
      targetMonth: 4,
      createdAt: 1,
    };

    const res = computeForecast(baseline, [item], {}, baseDate);
    expect(Number.isFinite(res.monthly[0].freeCashflow)).toBe(true);
    expect(Number.isFinite(res.finalBalanceMonth12)).toBe(true);
    expect(res.itemProgress[0].progressPct).toBe(100);
  });

  it('G3 (LOCKED): deducts remaining balance of overdue/month-0 unpaid item in Month 0 with wasReserved: false', () => {
    const baseline = createBaseline(); // monthly net = 10000 - 5000 = +5000
    const overdueItem: FinanceItem = {
      id: 'overdue-1',
      name: 'فاتورة متأخرة',
      category: 'debt',
      totalAmount: 4000,
      alreadySaved: 1000, // remaining = 3000
      targetMonth: 0,
      createdAt: 1,
    };

    const res = computeForecast(baseline, [overdueItem], {}, baseDate);

    expect(res.monthly[0].reservedForItems).toBe(0);
    expect(res.monthly[0].freeCashflow).toBe(5000 - 3000);
    expect(res.monthly[0].endingBalance).toBe(5000 + 2000);
    expect(res.monthly[0].itemSettlements).toEqual([
      {
        itemId: 'overdue-1',
        itemName: 'فاتورة متأخرة',
        category: 'debt',
        amount: 3000,
        wasReserved: false,
      },
    ]);

    // No duplicate deduction in months 1..11
    for (let m = 1; m < 12; m++) {
      expect(res.monthly[m].freeCashflow).toBe(5000);
      expect(res.monthly[m].itemSettlements).toHaveLength(0);
    }
  });

  it('G3: already-paid item with targetMonth <= 0 deducts 0 in Month 0 and marks wasReserved: true', () => {
    const baseline = createBaseline();
    const paidItem: FinanceItem = {
      id: 'paid-0',
      name: 'مدفوع',
      category: 'goal',
      totalAmount: 4000,
      alreadySaved: 4000,
      targetMonth: 0,
      createdAt: 1,
    };

    const res = computeForecast(baseline, [paidItem], {}, baseDate);
    expect(res.monthly[0].freeCashflow).toBe(5000);
    expect(res.monthly[0].itemSettlements).toEqual([
      {
        itemId: 'paid-0',
        itemName: 'مدفوع',
        category: 'goal',
        amount: 4000,
        wasReserved: true,
      },
    ]);
  });

  it('G4: reports isOverdue and monthsRemaining = 0 accurately for overdue vs paid vs future items', () => {
    const overdueUnpaid: FinanceItem = {
      id: '1',
      name: 'Overdue',
      category: 'debt',
      totalAmount: 5000,
      alreadySaved: 2000,
      targetMonth: -1,
      createdAt: 1,
    };
    const p1 = calculateItemProgress(overdueUnpaid, 0);
    expect(p1.isOverdue).toBe(true);
    expect(p1.monthsRemaining).toBe(0);
    expect(p1.monthlySlice).toBe(3000);

    const overduePaid: FinanceItem = {
      ...overdueUnpaid,
      id: '2',
      alreadySaved: 5000,
    };
    const p2 = calculateItemProgress(overduePaid, 0);
    expect(p2.isOverdue).toBe(false);
    expect(p2.monthsRemaining).toBe(0);
    expect(p2.monthlySlice).toBe(0);

    const futureItem: FinanceItem = {
      ...overdueUnpaid,
      id: '3',
      targetMonth: 3,
    };
    const p3 = calculateItemProgress(futureItem, 0);
    expect(p3.isOverdue).toBe(false);
    expect(p3.monthsRemaining).toBe(3);
    expect(p3.monthlySlice).toBe(1000);
  });

  it('G5: treats floating-point near-zero balances as break-even', () => {
    const baseline = createBaseline({
      fixedSalary: 5000,
      currentBalance: 1e-12,
      fixedBills: { rent: 3500, utilities: 0, subscriptions: 0, other: 0 },
      variableBuckets: { groceries: 1500, transport: 0, leisure: 0, other: 0 },
    });
    const res = computeForecast(baseline, [], {}, baseDate);
    expect(res.milestones[0].status).toBe('break-even');
  });

  it('G6: emits structured driverFacts on milestones and handles undefined projection', () => {
    expect(buildKeyDriverFacts(undefined, [], 0)).toEqual([{ kind: 'noData' }]);

    const baseline = createBaseline();
    const item: FinanceItem = {
      id: 's1',
      name: 'عيد الأضحى',
      category: 'shock',
      totalAmount: 6000,
      alreadySaved: 0,
      targetMonth: 3,
      createdAt: 1,
    };
    const res = computeForecast(baseline, [item], {}, baseDate);
    expect(res.milestones[0].driverFacts).toEqual([
      { kind: 'surplus', amount: 5000 },
      { kind: 'settling', names: ['عيد الأضحى'] },
    ]);
  });

  it('What-If Apply clamps cutting > 100% and negative extraSaving/extraExpense safely', () => {
    const baseline = createBaseline();
    const adjusted = applyWhatIfToBaseline(baseline, {
      extraMonthlySaving: -500,
      extraMonthlyExpense: -200,
      variableSpendingCutPct: 150,
    });

    expect(adjusted.sideIncome).toBe(0);
    expect(adjusted.fixedBills.other).toBe(200);
    expect(adjusted.variableBuckets.groceries).toBe(0);
  });
});
