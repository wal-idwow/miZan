// miZan — Custom Payment Modal (replaces native prompt)
import { useState } from 'react';
import { darija } from '../i18n/darija';
import { formatDH } from '../utils/format';

interface CustomPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  itemName: string;
  remainingAmount: number;
  monthlySlice: number;
}

export function CustomPaymentModal({ isOpen, onClose, onConfirm, itemName, remainingAmount, monthlySlice }: CustomPaymentModalProps) {
  const [amount, setAmount] = useState(Math.ceil(monthlySlice));
  const [showQuickChips] = useState(true);

  if (!isOpen) return null;

  const quickAmounts = [
    { label: 'الحصة الشهرية', value: Math.ceil(monthlySlice) },
    { label: 'نصف الباقي', value: Math.ceil(remainingAmount / 2) },
    { label: 'كل الباقي', value: remainingAmount },
  ].filter(q => q.value > 0 && q.value <= remainingAmount);

  const handleConfirm = () => {
    if (amount > 0 && amount <= remainingAmount) {
      onConfirm(amount);
      setAmount(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <div className="bg-white rounded-t-2xl rounded-b-none w-full max-w-md p-6 rtl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="payment-title" className="text-xl font-bold text-gray-900">{darija.items.progress.addPayment}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label={darija.a11y.closeModal}>×</button>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm text-gray-500">{darija.items.progress.addPaymentHint}</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">{darija.items.progress.monthlySlice}</p>
              <p className="font-medium text-gray-900">{formatDH(monthlySlice)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">{darija.items.progress.remaining}</p>
              <p className="font-medium text-gray-900">{formatDH(remainingAmount)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">{itemName}</p>
              <p className="font-medium text-gray-900 truncate max-w-[80px]">{itemName}</p>
            </div>
          </div>
        </div>

        {showQuickChips && quickAmounts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">مبالغ سريعة:</p>
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((q, i) => (
                <button
                  key={i}
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
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{darija.common.add} {darija.common.currencyShort}</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => {
              const val = Number(e.target.value);
              if (!isNaN(val)) setAmount(val);
            }}
            min={1}
            max={remainingAmount}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-2xl text-center min-h-[48px]"
            placeholder={formatDH(remainingAmount)}
            aria-label={darija.items.progress.addPaymentHint}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]">{darija.common.cancel}</button>
          <button onClick={handleConfirm} disabled={amount <= 0 || amount > remainingAmount} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">{darija.common.save}</button>
        </div>
      </div>
    </div>
  );
}