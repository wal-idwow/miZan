// miZan — What-If Simulator Panel
import { darija } from '../i18n/darija';
import { formatSignedNumber } from '../utils/format';
import type { WhatIfScenario } from '../types/finance';
import type { WhatIfDelta } from '../engine/forecast';
import { Field } from './ui/Field';
import { MoneyInput } from './ui/MoneyInput';

interface WhatIfPanelProps {
  whatIf: WhatIfScenario;
  onChange: (w: WhatIfScenario) => void;
  onReset: () => void;
  onApply: () => void;
  delta: WhatIfDelta | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function WhatIfPanel({
  whatIf,
  onChange,
  onReset,
  onApply,
  delta,
  isOpen,
  onToggle,
}: WhatIfPanelProps) {
  const handleChange = (field: keyof WhatIfScenario, value: number) => {
    onChange({ ...whatIf, [field]: value });
  };

  return (
    <section className="bg-white rounded-2xl border p-6" aria-labelledby="whatif-title">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 id="whatif-title" className="text-lg font-bold text-gray-900 flex flex-wrap items-center gap-2">
          {darija.whatIf.title}
          <span className="text-sm font-normal text-gray-500">{darija.whatIf.subtitle}</span>
        </h3>
        <button
          type="button"
          onClick={onToggle}
          className="text-sm text-emerald-600 hover:underline min-h-[44px] shrink-0"
          aria-label={isOpen ? 'طمس محاكي السيناريو' : 'إظهار محاكي السيناريو'}
        >
          {isOpen ? 'طمس' : 'إظهار'} {darija.whatIf.livePreview}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-4 animate-slide-down">
          <Field
            label={`${darija.whatIf.extraSaving} (${darija.common.perMonth})`}
            hint={darija.whatIf.extraSavingHint}
          >
            {({ id, ariaDescribedBy }) => (
              <MoneyInput
                id={id}
                value={whatIf.extraMonthlySaving ?? 0}
                onChange={val => handleChange('extraMonthlySaving', val)}
                min={0}
                placeholder={darija.whatIf.extraSavingHint}
                ariaDescribedBy={ariaDescribedBy}
              />
            )}
          </Field>

          <Field
            label={`${darija.whatIf.extraExpense} (${darija.common.perMonth})`}
            hint={darija.whatIf.extraExpenseHint}
          >
            {({ id, ariaDescribedBy }) => (
              <MoneyInput
                id={id}
                value={whatIf.extraMonthlyExpense ?? 0}
                onChange={val => handleChange('extraMonthlyExpense', val)}
                min={0}
                placeholder={darija.whatIf.extraExpenseHint}
                ariaDescribedBy={ariaDescribedBy}
                className="focus:ring-red-500"
              />
            )}
          </Field>

          <Field
            label={`${darija.whatIf.variableCut} (${darija.common.percent})`}
            hint={darija.whatIf.variableCutHint}
          >
            {({ id, ariaDescribedBy }) => (
              <MoneyInput
                id={id}
                value={whatIf.variableSpendingCutPct ?? 0}
                onChange={val => handleChange('variableSpendingCutPct', val)}
                min={0}
                max={100}
                placeholder={darija.whatIf.variableCutHint}
                ariaDescribedBy={ariaDescribedBy}
                className="focus:ring-amber-500"
              />
            )}
          </Field>

          {delta ? (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
              <h4 className="font-medium text-gray-800">{darija.whatIf.livePreview}</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month4Impact}</div>
                  <div
                    className={`text-xl font-bold ${delta.deltas.month4 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`}
                    dir="ltr"
                  >
                    {formatSignedNumber(delta.deltas.month4)}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month8Impact}</div>
                  <div
                    className={`text-xl font-bold ${delta.deltas.month8 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`}
                    dir="ltr"
                  >
                    {formatSignedNumber(delta.deltas.month8)}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-xs text-gray-500">{darija.whatIf.month12Impact}</div>
                  <div
                    className={`text-xl font-bold ${delta.deltas.month12 >= 0 ? 'text-green-600' : 'text-red-600'} inline-block`}
                    dir="ltr"
                  >
                    {formatSignedNumber(delta.deltas.month12)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 py-3 px-4 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 min-h-[44px]"
            >
              {darija.whatIf.reset}
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={!delta}
              className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {darija.whatIf.apply}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
