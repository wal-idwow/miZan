// miZan — Overview Tab Screen
import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { darija } from '../i18n/darija';
import type { WhatIfDelta } from '../engine/forecast';
import type { BaselineInput, ForecastResult, WhatIfScenario } from '../types/finance';
import { HeroBalanceCard } from '../components/HeroBalanceCard';
import { MilestoneCards } from '../components/MilestoneCards';
import { TimelineChart } from '../components/TimelineChart';
import { WhatIfPanel } from '../components/WhatIfPanel';
import { Sheet } from '../components/ui/Sheet';

interface OverviewScreenProps {
  baseline: BaselineInput;
  balanceUpdatedAt: number | null;
  freeCashflow: number;
  forecast: ForecastResult;
  whatIf: WhatIfScenario;
  delta: WhatIfDelta | null;
  onQuickCheckin: () => void;
  onWhatIfChange: (w: WhatIfScenario) => void;
  onWhatIfReset: () => void;
  onWhatIfApply: () => void;
}

export function OverviewScreen({
  baseline,
  balanceUpdatedAt,
  freeCashflow,
  forecast,
  whatIf,
  delta,
  onQuickCheckin,
  onWhatIfChange,
  onWhatIfReset,
  onWhatIfApply,
}: OverviewScreenProps) {
  const [highlightedMonth, setHighlightedMonth] = useState<4 | 8 | 12 | null>(null);
  const [whatIfSheetOpen, setWhatIfSheetOpen] = useState(false);

  const monthlyIncome = baseline.fixedSalary + (baseline.sideIncome || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-8 space-y-5 min-w-0">
        <HeroBalanceCard
          currentBalance={baseline.currentBalance}
          freeCashflow={freeCashflow}
          balanceUpdatedAt={balanceUpdatedAt}
          onQuickCheckin={onQuickCheckin}
        />

        <MilestoneCards
          milestones={forecast.milestones}
          currentBalance={baseline.currentBalance}
          highlightedMonth={highlightedMonth}
          onSelectMilestone={month =>
            setHighlightedMonth(prev => (prev === month ? null : month))
          }
        />

        <TimelineChart
          monthly={forecast.monthly}
          scenarioMonthly={delta?.scenarioResult.monthly}
          currentBalance={baseline.currentBalance}
          monthlyIncome={monthlyIncome}
          highlightedMonth={highlightedMonth}
          onQuickCheckin={onQuickCheckin}
        />

        <section className="lg:hidden bg-card rounded-2xl border border-line p-4 shadow-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <FlaskConical size={20} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink-900">{darija.whatIf.title}</h3>
              <p className="text-xs text-ink-600 truncate">
                {delta ? darija.whatIf.activeBanner : darija.whatIf.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWhatIfSheetOpen(true)}
            className="px-3.5 py-2.5 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded-xl text-xs font-semibold transition-colors min-h-[44px] shrink-0"
          >
            {darija.whatIf.entryCta}
          </button>
        </section>
      </div>

      <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20">
        <div className="bg-card rounded-2xl border border-line p-5 shadow-card">
          <WhatIfPanel
            whatIf={whatIf}
            onChange={onWhatIfChange}
            onReset={onWhatIfReset}
            onApply={onWhatIfApply}
            delta={delta}
          />
        </div>
      </aside>

      <Sheet
        isOpen={whatIfSheetOpen}
        onClose={() => setWhatIfSheetOpen(false)}
        title={darija.whatIf.title}
        variant="sheet"
        maxWidthClass="max-w-lg"
      >
        <WhatIfPanel
          whatIf={whatIf}
          onChange={onWhatIfChange}
          onReset={onWhatIfReset}
          onApply={() => {
            onWhatIfApply();
            setWhatIfSheetOpen(false);
          }}
          delta={delta}
        />
      </Sheet>
    </div>
  );
}
