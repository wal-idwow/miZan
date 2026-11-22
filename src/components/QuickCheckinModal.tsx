// miZan — Quick Check-in Modal (with local draft state)
import { useState } from 'react';
import { darija } from '../i18n/darija';
import type { BaselineInput } from '../types/finance';

interface QuickCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseline: BaselineInput;
  onSave: (b: BaselineInput) => void;
}

export function QuickCheckinModal({ isOpen, onClose, baseline, onSave }: QuickCheckinModalProps) {
  const [form, setForm] = useState<BaselineInput>(baseline);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkin-title">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 id="checkin-title" className="text-xl font-bold text-gray-900">{darija.checkin.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label={darija.a11y.closeModal}>×</button>
        </div>
        <p className="text-sm text-gray-500 mb-6">{darija.checkin.subtitle}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.checkin.currentBalance}</label>
            <input type="number" inputMode="decimal" value={form.currentBalance} onChange={e => setForm({ ...form, currentBalance: Number(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px]" placeholder={darija.checkin.currentBalanceHint} aria-label={darija.checkin.currentBalance} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.checkin.fixedSalary}</label>
            <input type="number" inputMode="decimal" value={form.fixedSalary} onChange={e => setForm({ ...form, fixedSalary: Number(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px]" placeholder={darija.checkin.fixedSalaryHint} aria-label={darija.checkin.fixedSalary} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.checkin.sideIncome}</label>
            <input type="number" inputMode="decimal" value={form.sideIncome} onChange={e => setForm({ ...form, sideIncome: Number(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px]" placeholder={darija.checkin.sideIncomeHint} aria-label={darija.checkin.sideIncome} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]">{darija.common.cancel}</button>
          <button onClick={handleSave} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 min-h-[44px]">{darija.common.save}</button>
        </div>
      </div>
    </div>
  );
}