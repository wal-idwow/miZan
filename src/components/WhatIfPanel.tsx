// miZan — Scenario Simulator Panel (range sliders + debounced preview + Apply confirm)
import { useEffect, useId, useRef, useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import { formatCurrencyText } from '../utils/format';
import type { WhatIfScenario } from '../types/finance';
import type { WhatIfDelta } from '../engine/forecast';
import { Money } from './ui/Money';
import { MoneyInput } from './ui/MoneyInput';
import { Sheet } from './ui/Sheet';

interface WhatIfPanelProps {
  whatIf: WhatIfScenario;
  onChange: (w: WhatIfScenario) => void;
  onReset: () => void;
  onApply: () => void;
  delta: WhatIfDelta | null;
}

export function WhatIfPanel({
  whatIf,
  onChange,
  onReset,
  onApply,
  delta,
}: WhatIfPanelProps) {
  const savingId = useId();
  const expenseId = useId();
  const cutId = useId();

  const [draft, setDraft] = useState<WhatIfScenario>(whatIf);
  const [confirmApplyOpen, setConfirmApplyOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const scheduleUpdate = (next: WhatIfScenario) => {
    setDraft(next);
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onChange(next);
    }, 50);
  };

  const flushPending = () => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
      onChange(draft);
    }
  };

  const handleReset = () => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setDraft({});
    onReset();
  };

  const handleOpenConfirm = () => {
    flushPending();
    setConfirmApplyOpen(true);
  };

  const handleConfirmApply = () => {
    setConfirmApplyOpen(false);
    setDraft({});
    onApply();
  };

  const savingVal = draft.extraMonthlySaving ?? 0;
  const expenseVal = draft.extraMonthlyExpense ?? 0;
  const cutVal = draft.variableSpendingCutPct ?? 0;

  const activeSummaryLines: string[] = [];
  if (savingVal > 0) {
    activeSummaryLines.push(
      t(darija.whatIf.confirmExtraSaving, { amount: formatCurrencyText(savingVal) })
    );
  }
  if (expenseVal > 0) {
    activeSummaryLines.push(
      t(darija.whatIf.confirmExtraExpense, { amount: formatCurrencyText(expenseVal) })
    );
  }
  if (cutVal > 0) {
    activeSummaryLines.push(t(darija.whatIf.confirmVariableCut, { percent: cutVal }));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-ink-900">
          <FlaskConical size={18} strokeWidth={1.75} className="text-brand-600 shrink-0" aria-hidden="true" />
          <h3 className="text-base font-bold">{darija.whatIf.title}</h3>
        </div>
        <p className="text-xs text-ink-600">{darija.whatIf.subtitle}</p>
      </div>

      {delta ? (
        <div className="px-3 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-medium flex items-center gap-2">
          <FlaskConical size={15} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
          <span>{darija.whatIf.activeBanner}</span>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor={savingId} className="block text-sm font-medium text-ink-900">
            {darija.whatIf.extraSaving}
          </label>
          <input
            type="range"
            min={0}
            max={5000}
            step={100}
            value={Math.min(5000, savingVal)}
            onChange={e => scheduleUpdate({ ...draft, extraMonthlySaving: Number(e.target.value) })}
            aria-label={darija.whatIf.extraSaving}
            className="w-full mizan-slider"
          />
          <MoneyInput
            id={savingId}
            value={savingVal}
            onChange={val => scheduleUpdate({ ...draft, extraMonthlySaving: val })}
            min={0}
            placeholder={darija.whatIf.extraSavingHint}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={expenseId} className="block text-sm font-medium text-ink-900">
            {darija.whatIf.extraExpense}
          </label>
          <input
            type="range"
            min={0}
            max={10000}
            step={100}
            value={Math.min(10000, expenseVal)}
            onChange={e => scheduleUpdate({ ...draft, extraMonthlyExpense: Number(e.target.value) })}
            aria-label={darija.whatIf.extraExpense}
            className="w-full mizan-slider"
          />
          <MoneyInput
            id={expenseId}
            value={expenseVal}
            onChange={val => scheduleUpdate({ ...draft, extraMonthlyExpense: val })}
            min={0}
            placeholder={darija.whatIf.extraExpenseHint}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={cutId} className="block text-sm font-medium text-ink-900">
            {darija.whatIf.variableCut}
          </label>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={Math.min(50, cutVal)}
            onChange={e =>
              scheduleUpdate({ ...draft, variableSpendingCutPct: Number(e.target.value) })
            }
            aria-label={darija.whatIf.variableCut}
            className="w-full mizan-slider"
          />
          <MoneyInput
            id={cutId}
            value={cutVal}
            onChange={val => scheduleUpdate({ ...draft, variableSpendingCutPct: val })}
            min={0}
            max={100}
            suffix={darija.common.percent}
            placeholder={darija.whatIf.variableCutHint}
          />
        </div>
      </div>

      {delta ? (
        <div className="bg-surface rounded-xl p-3.5 space-y-2.5 border border-line">
          <h4 className="text-xs font-semibold text-ink-600">{darija.whatIf.livePreview}</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(
              [
                { label: darija.whatIf.month4Impact, val: delta.deltas.month4 },
                { label: darija.whatIf.month8Impact, val: delta.deltas.month8 },
                { label: darija.whatIf.month12Impact, val: delta.deltas.month12 },
              ] as const
            ).map(item => (
              <div key={item.label} className="p-2.5 bg-card rounded-xl border border-line">
                <div className="text-[11px] text-ink-400">{item.label}</div>
                <div
                  className={`text-sm font-bold ${
                    item.val >= 0 ? 'text-positive-600' : 'text-negative-600'
                  }`}
                >
                  <Money amount={item.val} signed showCurrency={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2.5 border border-line text-ink-600 rounded-xl text-sm font-medium hover:bg-surface min-h-[44px] flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{darija.whatIf.reset}</span>
        </button>
        <button
          type="button"
          onClick={handleOpenConfirm}
          disabled={!delta}
          className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {darija.whatIf.apply}
        </button>
      </div>

      <Sheet
        isOpen={confirmApplyOpen}
        onClose={() => setConfirmApplyOpen(false)}
        title={darija.whatIf.applyConfirmTitle}
        variant="dialog"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">{darija.whatIf.applyConfirmBody}</p>
          <ul className="space-y-2 bg-surface rounded-xl p-3.5 border border-line text-sm text-ink-900">
            {activeSummaryLines.map(line => (
              <li key={line} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmApplyOpen(false)}
              className="flex-1 py-2.5 px-4 border border-line rounded-xl text-ink-600 font-medium hover:bg-surface min-h-[44px]"
            >
              {darija.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmApply}
              className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 min-h-[44px]"
            >
              {darija.common.confirm}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
