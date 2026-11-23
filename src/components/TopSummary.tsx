// miZan — Top Summary KPI Cards
import { darija } from '../i18n/darija';
import type { BaselineInput } from '../types/finance';
import { Money } from './ui/Money';

interface TopSummaryProps {
  baseline: BaselineInput;
  freeCashflow: number;
  itemsCount: number;
}

export function TopSummary({ baseline, freeCashflow, itemsCount }: TopSummaryProps) {
  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="summary-title">
      <h2 id="summary-title" className="text-lg font-bold text-gray-900 mb-4">
        {darija.vision.title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 border">
          <p className="text-sm text-gray-500">{darija.checkin.currentBalance}</p>
          <p className="text-2xl font-bold text-gray-900">
            <Money amount={baseline.currentBalance} />
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border">
          <p className="text-sm text-gray-500">{darija.checkin.monthlyFreeCashflow}</p>
          <p
            className={`text-2xl font-bold ${
              freeCashflow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <Money amount={freeCashflow} signed />
          </p>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 border">
          <p className="text-sm text-gray-500">{darija.items.title}</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            <bdi dir="ltr">{itemsCount}</bdi>
          </p>
        </div>
      </div>
    </section>
  );
}
