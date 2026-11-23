// miZan — Custom Payment Modal (mount-on-open draft state via Sheet)
import { useState } from 'react';
import { darija } from '../i18n/darija';
import { formatCurrencyText } from '../utils/format';
import { Field } from './ui/Field';
import { Money } from './ui/Money';
import { MoneyInput } from './ui/MoneyInput';
import { Sheet } from './ui/Sheet';

interface CustomPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  itemName: string;
  remainingAmount: number;
  monthlySlice: number;
}

function CustomPaymentForm({
  onClose,
  onConfirm,
  itemName,
  remainingAmount,
  monthlySlice,
}: Omit<CustomPaymentModalProps, 'isOpen'>) {
  const initialAmount =
    remainingAmount > 0
      ? Math.min(remainingAmount, Math.max(1, Math.ceil(monthlySlice)))
      : 0;
  const [amount, setAmount] = useState(initialAmount);

  const quickAmounts = [
    {
      label: darija.items.progress.monthlySlice,
      value: Math.min(remainingAmount, Math.ceil(monthlySlice)),
    },
    { label: darija.items.progress.halfRemaining, value: Math.ceil(remainingAmount / 2) },
    { label: darija.items.progress.allRemaining, value: remainingAmount },
  ].filter(
    (q, idx, arr) =>
      q.value > 0 &&
      q.value <= remainingAmount &&
      arr.findIndex(other => other.value === q.value) === idx
  );

  const isInvalid = amount <= 0 || amount > remainingAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInvalid) {
      onConfirm(amount);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">{itemName}</p>
        <p className="text-xs text-ink-600 mt-0.5">{darija.items.progress.addPaymentHint}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2.5 bg-surface rounded-xl text-center">
          <p className="text-xs text-ink-400">{darija.items.progress.monthlySlice}</p>
          <p className="font-semibold text-ink-900">
            <Money amount={monthlySlice} />
          </p>
        </div>
        <div className="p-2.5 bg-surface rounded-xl text-center">
          <p className="text-xs text-ink-400">{darija.items.progress.remaining}</p>
          <p className="font-semibold text-ink-900">
            <Money amount={remainingAmount} />
          </p>
        </div>
      </div>

      {quickAmounts.length > 0 ? (
        <div>
          <p className="text-xs text-ink-400 mb-2">{darija.items.progress.quickAmounts}</p>
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map(q => (
              <button
                type="button"
                key={q.value}
                onClick={() => setAmount(q.value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[44px] border ${
                  amount === q.value
                    ? 'bg-brand-50 text-brand-700 border-brand-600'
                    : 'bg-surface text-ink-600 border-line hover:text-ink-900'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Field label={darija.items.progress.addPaymentHint}>
        {({ id }) => (
          <MoneyInput
            id={id}
            size="lg"
            value={amount}
            onChange={setAmount}
            min={0}
            max={Math.max(0, remainingAmount)}
            placeholder={formatCurrencyText(remainingAmount)}
            inputClassName="text-center"
            autoFocus
          />
        )}
      </Field>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 border border-line rounded-xl text-ink-600 font-medium hover:bg-surface min-h-[44px]"
        >
          {darija.common.cancel}
        </button>
        <button
          type="submit"
          disabled={isInvalid}
          className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {darija.common.save}
        </button>
      </div>
    </form>
  );
}

export function CustomPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  remainingAmount,
  monthlySlice,
}: CustomPaymentModalProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={darija.items.progress.addPayment}
      variant="sheet"
      closeOnBackdrop={false}
    >
      <CustomPaymentForm
        onClose={onClose}
        onConfirm={onConfirm}
        itemName={itemName}
        remainingAmount={remainingAmount}
        monthlySlice={monthlySlice}
      />
    </Sheet>
  );
}
