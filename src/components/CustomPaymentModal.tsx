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
        <p className="text-sm font-medium text-gray-800">{itemName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{darija.items.progress.addPaymentHint}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="p-2.5 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">{darija.items.progress.monthlySlice}</p>
          <p className="font-medium text-gray-900">
            <Money amount={monthlySlice} />
          </p>
        </div>
        <div className="p-2.5 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500">{darija.items.progress.remaining}</p>
          <p className="font-medium text-gray-900">
            <Money amount={remainingAmount} />
          </p>
        </div>
      </div>

      {quickAmounts.length > 0 ? (
        <div>
          <p className="text-xs text-gray-500 mb-2">{darija.items.progress.quickAmounts}</p>
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map(q => (
              <button
                type="button"
                key={q.value}
                onClick={() => setAmount(q.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  amount === q.value
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            value={amount}
            onChange={setAmount}
            min={0}
            max={Math.max(0, remainingAmount)}
            placeholder={formatCurrencyText(remainingAmount)}
            className="text-2xl text-center min-h-[48px]"
            autoFocus
          />
        )}
      </Field>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
        >
          {darija.common.cancel}
        </button>
        <button
          type="submit"
          disabled={isInvalid}
          className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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
