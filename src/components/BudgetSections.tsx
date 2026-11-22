// miZan — Fixed Bills & Variable Buckets (Budget Sections)
import { darija } from '../i18n/darija';
import { formatDH } from '../utils/format';
import type { BaselineInput } from '../types/finance';

interface BillsSectionProps {
  bills: BaselineInput['fixedBills'];
  onChange: (b: BaselineInput['fixedBills']) => void;
}

function BillsSection({ bills, onChange }: BillsSectionProps) {
  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="bills-title">
      <h3 id="bills-title" className="text-lg font-bold text-gray-900 mb-1">{darija.bills.title}</h3>
      <p className="text-sm text-gray-500 mb-4">{darija.bills.subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.rent}</label>
          <input type="number" inputMode="decimal" value={bills.rent} onChange={e => onChange({ ...bills, rent: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.utilities}</label>
          <input type="number" inputMode="decimal" value={bills.utilities} onChange={e => onChange({ ...bills, utilities: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.subscriptions}</label>
          <input type="number" inputMode="decimal" value={bills.subscriptions} onChange={e => onChange({ ...bills, subscriptions: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.bills.other}</label>
          <input type="number" inputMode="decimal" value={bills.other} onChange={e => onChange({ ...bills, other: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-gray-600">{darija.bills.total}</span>
        <span className="text-xl font-bold text-gray-900">{formatDH(bills.rent + bills.utilities + bills.subscriptions + bills.other)}</span>
      </div>
    </section>
  );
}

interface BucketsSectionProps {
  buckets: BaselineInput['variableBuckets'];
  onChange: (b: BaselineInput['variableBuckets']) => void;
}

function BucketsSection({ buckets, onChange }: BucketsSectionProps) {
  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="buckets-title">
      <h3 id="buckets-title" className="text-lg font-bold text-gray-900 mb-1">{darija.buckets.title}</h3>
      <p className="text-sm text-gray-500 mb-4">{darija.buckets.subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.groceries}</label>
          <input type="number" inputMode="decimal" value={buckets.groceries} onChange={e => onChange({ ...buckets, groceries: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.transport}</label>
          <input type="number" inputMode="decimal" value={buckets.transport} onChange={e => onChange({ ...buckets, transport: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.leisure}</label>
          <input type="number" inputMode="decimal" value={buckets.leisure} onChange={e => onChange({ ...buckets, leisure: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.buckets.other}</label>
          <input type="number" inputMode="decimal" value={buckets.other} onChange={e => onChange({ ...buckets, other: Number(e.target.value) || 0 })} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[44px]" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-gray-600">{darija.buckets.total}</span>
        <span className="text-xl font-bold text-gray-900">{formatDH(buckets.groceries + buckets.transport + buckets.leisure + buckets.other)}</span>
      </div>
    </section>
  );
}

interface BudgetSectionsProps {
  bills: BaselineInput['fixedBills'];
  onBillsChange: (b: BaselineInput['fixedBills']) => void;
  buckets: BaselineInput['variableBuckets'];
  onBucketsChange: (b: BaselineInput['variableBuckets']) => void;
}

export function BudgetSections({ bills, onBillsChange, buckets, onBucketsChange }: BudgetSectionsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BillsSection bills={bills} onChange={onBillsChange} />
      <BucketsSection buckets={buckets} onChange={onBucketsChange} />
    </div>
  );
}