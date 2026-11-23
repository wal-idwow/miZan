// miZan — Collapsible Fixed Bills & Variable Buckets Sections
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { darija } from '../i18n/darija';
import type { BaselineInput } from '../types/finance';
import { Field } from './ui/Field';
import { Money } from './ui/Money';
import { MoneyInput } from './ui/MoneyInput';

interface BillsSectionProps {
  bills: BaselineInput['fixedBills'];
  onChange: (b: BaselineInput['fixedBills']) => void;
}

function BillsSection({ bills, onChange }: BillsSectionProps) {
  const [open, setOpen] = useState(true);
  const total = bills.rent + bills.utilities + bills.subscriptions + bills.other;

  return (
    <section
      className="bg-card rounded-2xl border border-line shadow-card overflow-hidden"
      aria-labelledby="bills-title"
    >
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start hover:bg-surface/50 transition-colors min-h-[44px]"
      >
        <div>
          <h3 id="bills-title" className="text-base font-bold text-ink-900">
            {darija.bills.title}
          </h3>
          <p className="text-xs text-ink-600 mt-0.5">{darija.bills.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-ink-900">
            <Money amount={total} />
          </span>
          {open ? (
            <ChevronUp size={18} strokeWidth={1.75} className="text-ink-400" aria-hidden="true" />
          ) : (
            <ChevronDown size={18} strokeWidth={1.75} className="text-ink-400" aria-hidden="true" />
          )}
        </div>
      </button>

      {open ? (
        <div className="px-4 pb-5 sm:px-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-line pt-4">
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
      ) : null}
    </section>
  );
}

interface BucketsSectionProps {
  buckets: BaselineInput['variableBuckets'];
  onChange: (b: BaselineInput['variableBuckets']) => void;
}

function BucketsSection({ buckets, onChange }: BucketsSectionProps) {
  const [open, setOpen] = useState(true);
  const total = buckets.groceries + buckets.transport + buckets.leisure + buckets.other;

  return (
    <section
      className="bg-card rounded-2xl border border-line shadow-card overflow-hidden"
      aria-labelledby="buckets-title"
    >
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-start hover:bg-surface/50 transition-colors min-h-[44px]"
      >
        <div>
          <h3 id="buckets-title" className="text-base font-bold text-ink-900">
            {darija.buckets.title}
          </h3>
          <p className="text-xs text-ink-600 mt-0.5">{darija.buckets.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-ink-900">
            <Money amount={total} />
          </span>
          {open ? (
            <ChevronUp size={18} strokeWidth={1.75} className="text-ink-400" aria-hidden="true" />
          ) : (
            <ChevronDown size={18} strokeWidth={1.75} className="text-ink-400" aria-hidden="true" />
          )}
        </div>
      </button>

      {open ? (
        <div className="px-4 pb-5 sm:px-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-line pt-4">
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
      ) : null}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BillsSection bills={bills} onChange={onBillsChange} />
      <BucketsSection buckets={buckets} onChange={onBucketsChange} />
    </div>
  );
}
