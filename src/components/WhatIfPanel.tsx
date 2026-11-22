// miZan — What-If Simulator Panel
import { darija } from '../i18n/darija';
import { formatSignedNumber } from '../utils/format';
import type { WhatIfScenario } from '../types/finance';
import { computeWhatIfDelta } from '../engine/forecast';

interface WhatIfPanelProps {
  whatIf: WhatIfScenario;
  onChange: (w: WhatIfScenario) => void;
  onReset: () => void;
  onApply: () => void;
  delta: ReturnType<typeof computeWhatIfDelta> | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function WhatIfPanel({ whatIf, onChange, onReset, onApply, delta, isOpen, onToggle }: WhatIfPanelProps) {
  const handleChange = (field: keyof WhatIfScenario, value: number) => {
    onChange({ ...whatIf, [field]: value });
  };

  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="whatif-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="whatif-title" className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {darija.whatIf.title}
          <span className="text-sm text-gray-500">{darija.whatIf.subtitle}</span>
        </h3>
        <button onClick={onToggle} className="text-sm text-emerald-600 hover:underline" aria-label={isOpen ? 'طمس محاكي السيناريو' : 'إظهار محاكي السيناريو'}>
          {isOpen ? 'طمس' : 'إظهار'} {darija.whatIf.livePreview}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 animate-slide-down">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.whatIf.extraSaving} <span className="text-xs text-gray-400">({darija.common.perMonth})</span></label>
            <input type="number" inputMode="decimal" value={whatIf.extraMonthlySaving || 0} onChange={e => handleChange('extraMonthlySaving', Number(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px]" placeholder={darija.whatIf.extraSavingHint} aria-label={darija.whatIf.extraSaving} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.whatIf.extraExpense} <span className="text-xs text-gray-400">({darija.common.perMonth})</span></label>
            <input type="number" inputMode="decimal" value={whatIf.extraMonthlyExpense || 0} onChange={e => handleChange('extraMonthlyExpense', Number(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[44px]" placeholder={darija.whatIf.extraExpenseHint} aria-label={darija.whatIf.extraExpense} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{darija.whatIf.variableCut} <span className="text-xs text-gray-400">({darija.common.percent})</span></label>
            <input type="number" inputMode="decimal" value={whatIf.variableSpendingCutPct || 0} onChange={e => handleChange('variableSpendingCutPct', Number(e.target.value) || 0)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[44px]" placeholder={darija.whatIf.variableCutHint} aria-label={darija.whatIf.variableCut} max="100" min="0" />
          </div>

          {delta && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <h4 className="font-medium text-gray-800 flex items-center gap-2">{darija.whatIf.livePreview}</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month4Impact}</div>
                  <div className={`text-xl font-bold ${delta.deltas.month4 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`} dir="ltr">
                    {formatSignedNumber(delta.deltas.month4)}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month8Impact}</div>
                  <div className={`text-xl font-bold ${delta.deltas.month8 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`} dir="ltr">
                    {formatSignedNumber(delta.deltas.month8)}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month12Impact}</div>
                  <div className={`text-xl font-bold ${delta.deltas.month12 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`} dir="ltr">
                    {formatSignedNumber(delta.deltas.month12)}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">{darija.whatIf.goalsImpact}</div>
                <div className="flex gap-4 text-sm mt-1">
                  {delta.deltas.goalCompletionChanges.map((g: { itemId: string; baselinePct: number; scenarioPct: number }) => (
                    <span key={g.itemId} className="text-gray-600">
                      {g.baselinePct}% → {g.scenarioPct}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onReset} className="flex-1 py-3 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 min-h-[44px]">{darija.whatIf.reset}</button>
            <button onClick={onApply} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 min-h-[44px]">{darija.whatIf.apply}</button>
          </div>
        </div>
      )}
    </section>
  );
}