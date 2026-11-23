// miZan — Quick Check-in Sheet (autofocused balance, delta preview & collapsed income disclosure)
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import { formatCurrencyText } from '../utils/format';
import type { BaselineInput } from '../types/finance';
import { Field } from './ui/Field';
import { MoneyInput } from './ui/MoneyInput';
import { Sheet } from './ui/Sheet';

interface QuickCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseline: BaselineInput;
  onSave: (b: BaselineInput) => void;
}

function QuickCheckinForm({
  baseline,
  onClose,
  onSave,
}: Omit<QuickCheckinModalProps, 'isOpen'>) {
  const [form, setForm] = useState<BaselineInput>(baseline);
  const [showIncome, setShowIncome] = useState(() => baseline.fixedSalary === 0);

  const delta = form.currentBalance - baseline.currentBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
    onSave(form);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-600">{darija.checkin.subtitle}</p>

      <div className="space-y-1.5">
        <Field label={darija.checkin.currentBalance} hint={darija.checkin.currentBalanceHint}>
          {({ id, ariaDescribedBy }) => (
            <MoneyInput
              id={id}
              size="lg"
              value={form.currentBalance}
              onChange={currentBalance => setForm(prev => ({ ...prev, currentBalance }))}
              allowNegative
              placeholder={darija.checkin.currentBalanceHint}
              ariaDescribedBy={ariaDescribedBy}
              autoFocus
            />
          )}
        </Field>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
          <span>
            {t(darija.checkin.previous, { amount: formatCurrencyText(baseline.currentBalance) })}
          </span>
          {delta !== 0 ? (
            <span className={delta > 0 ? 'text-positive-600 font-medium' : 'text-negative-600 font-medium'}>
              {t(darija.checkin.difference, {
                amount: formatCurrencyText(delta, { signed: true }),
              })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setShowIncome(prev => !prev)}
          aria-expanded={showIncome}
          className="w-full flex items-center justify-between py-2 text-sm font-medium text-brand-700 hover:text-brand-600 min-h-[44px]"
        >
          <span>{darija.checkin.editIncome}</span>
          {showIncome ? (
            <ChevronUp size={18} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>

        {showIncome ? (
          <div className="space-y-3 pt-2 animate-slide-down">
            <Field label={darija.checkin.fixedSalary} hint={darija.checkin.fixedSalaryHint}>
              {({ id, ariaDescribedBy }) => (
                <MoneyInput
                  id={id}
                  value={form.fixedSalary}
                  onChange={fixedSalary => setForm(prev => ({ ...prev, fixedSalary }))}
                  min={0}
                  placeholder={darija.checkin.fixedSalaryHint}
                  ariaDescribedBy={ariaDescribedBy}
                />
              )}
            </Field>
            <Field label={darija.checkin.sideIncome} hint={darija.checkin.sideIncomeHint}>
              {({ id, ariaDescribedBy }) => (
                <MoneyInput
                  id={id}
                  value={form.sideIncome}
                  onChange={sideIncome => setForm(prev => ({ ...prev, sideIncome }))}
                  min={0}
                  placeholder={darija.checkin.sideIncomeHint}
                  ariaDescribedBy={ariaDescribedBy}
                />
              )}
            </Field>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 bg-card pt-3 border-t border-line flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 border border-line rounded-xl text-ink-600 font-medium hover:bg-surface min-h-[44px]"
        >
          {darija.checkin.cancel}
        </button>
        <button
          type="submit"
          className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 min-h-[44px]"
        >
          {darija.checkin.save}
        </button>
      </div>
    </form>
  );
}

export function QuickCheckinModal({
  isOpen,
  onClose,
  baseline,
  onSave,
}: QuickCheckinModalProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={darija.checkin.title}
      variant="sheet"
      closeOnBackdrop={false}
    >
      <QuickCheckinForm baseline={baseline} onClose={onClose} onSave={onSave} />
    </Sheet>
  );
}
