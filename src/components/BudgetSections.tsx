// miZan — Fixed Bills & Variable Buckets (Budget Sections)
import { darija } from '../i18n/darija';
import { formatDH } from '../utils/format';
import type { BaselineInput } from '../types/finance';
import { Field } from './ui/Field';
import { MoneyInput } from './ui/MoneyInput';

interface BillsSectionProps {
  bills: BaselineInput['fixedBills'];
  onChange: (b: BaselineInput['fixedBills']) => void;
}

function BillsSection({ bills, onChange }: BillsSectionProps) {
  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="bills-title">
      <h3 id="bills-title" className="text-lg font-bold text-gray-900 mb-1">
        {darija.bills.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{darija.bills.subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={darija.bills.rent}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={bills.rent}
              onChange={rent => onChange({ ...bills, rent })}
              min={0}
            />
          )}
        </Field>
        <Field label={darija.bills.utilities}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={bills.utilities}
              onChange={utilities => onChange({ ...bills, utilities })}
              min={0}
            />
          )}
        </Field>
        <Field label={darija.bills.subscriptions}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={bills.subscriptions}
              onChange={subscriptions => onChange({ ...bills, subscriptions })}
              min={0}
            />
          )}
        </Field>
        <Field label={darija.bills.other}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={bills.other}
              onChange={other => onChange({ ...bills, other })}
              min={0}
            />
          )}
        </Field>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-gray-600">{darija.bills.total}</span>
        <span className="text-xl font-bold text-gray-900">
          {formatDH(bills.rent + bills.utilities + bills.subscriptions + bills.other)}
        </span>
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
      <h3 id="buckets-title" className="text-lg font-bold text-gray-900 mb-1">
        {darija.buckets.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{darija.buckets.subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={darija.buckets.groceries}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={buckets.groceries}
              onChange={groceries => onChange({ ...buckets, groceries })}
              min={0}
            />
          )}
        </Field>
        <Field label={darija.buckets.transport}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={buckets.transport}
              onChange={transport => onChange({ ...buckets, transport })}
              min={0}
            />
          )}
        </Field>
        <Field label={darija.buckets.leisure}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={buckets.leisure}
              onChange={leisure => onChange({ ...buckets, leisure })}
              min={0}
            />
          )}
        </Field>
        <Field label={darija.buckets.other}>
          {({ id }) => (
            <MoneyInput
              id={id}
              value={buckets.other}
              onChange={other => onChange({ ...buckets, other })}
              min={0}
            />
          )}
        </Field>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-gray-600">{darija.buckets.total}</span>
        <span className="text-xl font-bold text-gray-900">
          {formatDH(buckets.groceries + buckets.transport + buckets.leisure + buckets.other)}
        </span>
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

export function BudgetSections({
  bills,
  onBillsChange,
  buckets,
  onBucketsChange,
}: BudgetSectionsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BillsSection bills={bills} onChange={onBillsChange} />
      <BucketsSection buckets={buckets} onChange={onBucketsChange} />
    </div>
  );
}
