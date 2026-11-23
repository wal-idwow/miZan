// miZan — Quick Check-in Modal (mount-on-open draft state via Sheet)
import { useState } from 'react';
import { darija } from '../i18n/darija';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">{darija.checkin.subtitle}</p>
      <Field label={darija.checkin.currentBalance} hint={darija.checkin.currentBalanceHint}>
        {({ id, ariaDescribedBy }) => (
          <MoneyInput
            id={id}
            value={form.currentBalance}
            onChange={currentBalance => setForm(prev => ({ ...prev, currentBalance }))}
            allowNegative
            placeholder={darija.checkin.currentBalanceHint}
            ariaDescribedBy={ariaDescribedBy}
            autoFocus
          />
        )}
      </Field>
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
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
        >
          {darija.common.cancel}
        </button>
        <button
          type="submit"
          className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 min-h-[44px]"
        >
          {darija.common.save}
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
