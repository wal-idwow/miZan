// miZan — Budget Tab Screen with Sticky Equation Strip
import { sumFixedBills, sumVariableBuckets } from '../engine/forecast';
import { darija } from '../i18n/darija';
import type { BaselineInput, ForecastResult } from '../types/finance';
import { BudgetSections } from '../components/BudgetSections';
import { Money } from '../components/ui/Money';

interface BudgetScreenProps {
  baseline: BaselineInput;
  forecast: ForecastResult;
  freeCashflow: number;
  onBillsChange: (b: BaselineInput['fixedBills']) => void;
  onBucketsChange: (b: BaselineInput['variableBuckets']) => void;
}

export function BudgetScreen({
  baseline,
  forecast,
  freeCashflow,
  onBillsChange,
  onBucketsChange,
}: BudgetScreenProps) {
  const income = baseline.fixedSalary + (baseline.sideIncome || 0);
  const fixedTotal = sumFixedBills(baseline.fixedBills);
  const variableTotal = sumVariableBuckets(baseline.variableBuckets);
  const reserved = forecast.totalMonthlyReserved;

  return (
    <div className="space-y-5">
      <section
        aria-label={darija.budget.equation}
        className="sticky top-[3.75rem] z-20 bg-card/95 backdrop-blur-md rounded-2xl border border-line p-3.5 sm:p-4 shadow-card space-y-2.5"
      >
        <p className="text-xs font-medium text-ink-600">{darija.budget.equation}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="p-2 rounded-xl bg-surface">
            <div className="text-[11px] text-ink-400">{darija.budget.income}</div>
            <div className="text-xs sm:text-sm font-bold text-ink-900">
              <Money amount={income} showCurrency={false} />
            </div>
          </div>
          <div className="p-2 rounded-xl bg-surface">
            <div className="text-[11px] text-ink-400">{darija.budget.fixed}</div>
            <div className="text-xs sm:text-sm font-bold text-ink-900">
              <Money amount={fixedTotal} showCurrency={false} />
            </div>
          </div>
          <div className="p-2 rounded-xl bg-surface">
            <div className="text-[11px] text-ink-400">{darija.budget.variable}</div>
            <div className="text-xs sm:text-sm font-bold text-ink-900">
              <Money amount={variableTotal} showCurrency={false} />
            </div>
          </div>
          <div className="p-2 rounded-xl bg-surface">
            <div className="text-[11px] text-ink-400">{darija.budget.reserved}</div>
            <div className="text-xs sm:text-sm font-bold text-ink-900">
              <Money amount={reserved} showCurrency={false} />
            </div>
          </div>
          <div
            className={`col-span-2 sm:col-span-1 p-2 rounded-xl ${
              freeCashflow >= 0 ? 'bg-positive-50' : 'bg-negative-50'
            }`}
          >
            <div className="text-[11px] text-ink-600">{darija.budget.leftover}</div>
            <div
              className={`text-xs sm:text-sm font-bold ${
                freeCashflow >= 0 ? 'text-positive-600' : 'text-negative-600'
              }`}
            >
              <Money amount={freeCashflow} signed />
            </div>
          </div>
        </div>
      </section>

      <BudgetSections
        bills={baseline.fixedBills}
        onBillsChange={onBillsChange}
        buckets={baseline.variableBuckets}
        onBucketsChange={onBucketsChange}
      />
    </div>
  );
}
