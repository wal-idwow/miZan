// miZan — Milestone Cards (4/8/12 Month Vision Carousel & Grid)
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import type { KeyDriverFact, MilestoneCard } from '../types/finance';
import { Money } from './ui/Money';

function getMilestoneHorizonLabel(month: 4 | 8 | 12): string {
  if (month === 4) return darija.vision.month4;
  if (month === 8) return darija.vision.month8;
  return darija.vision.month12;
}

function renderDriverFact(fact: KeyDriverFact) {
  switch (fact.kind) {
    case 'surplus':
    case 'deficit':
    case 'reserved': {
      const template = darija.vision.drivers[fact.kind];
      const [before, after] = template.split('{amount}');
      return (
        <>
          {before}
          <Money amount={fact.amount} className="font-semibold text-ink-900" />
          {after}
        </>
      );
    }
    case 'settling':
      return t(darija.vision.drivers.settling, {
        names: fact.names.join(darija.common.listSeparator),
      });
    case 'stable':
      return darija.vision.drivers.stable;
    case 'noData':
      return darija.vision.drivers.noData;
  }
}

interface MilestoneCardsProps {
  milestones: MilestoneCard[];
  currentBalance: number;
  highlightedMonth: 4 | 8 | 12 | null;
  onSelectMilestone: (month: 4 | 8 | 12) => void;
}

export function MilestoneCards({
  milestones,
  currentBalance,
  highlightedMonth,
  onSelectMilestone,
}: MilestoneCardsProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const root = carouselRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (Number.isInteger(idx)) {
              setActiveSlide(idx);
            }
          }
        }
      },
      { root, threshold: 0.65 }
    );

    for (const el of cardRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [milestones.length]);

  const statusConfig = {
    surplus: {
      stripe: 'border-s-positive-600',
      badge: 'bg-positive-50 text-positive-600',
      icon: CheckCircle2,
      text: darija.vision.status.surplus,
    },
    deficit: {
      stripe: 'border-s-negative-600',
      badge: 'bg-negative-50 text-negative-600',
      icon: AlertTriangle,
      text: darija.vision.status.deficit,
    },
    'break-even': {
      stripe: 'border-s-warning-600',
      badge: 'bg-warning-50 text-warning-600',
      icon: MinusCircle,
      text: darija.vision.status.breakEven,
    },
  };

  return (
    <section aria-labelledby="milestones-title" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="milestones-title" className="text-base font-bold text-ink-900">
          {darija.vision.title}
        </h2>
        <p className="text-xs text-ink-600">{darija.vision.subtitle}</p>
      </div>

      <div
        ref={carouselRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-1 no-scrollbar sm:grid sm:grid-cols-3 sm:overflow-visible"
      >
        {milestones.map((ms, index) => {
          const cfg = statusConfig[ms.status];
          const StatusIcon = cfg.icon;
          const isHighlighted = highlightedMonth === ms.month;
          const deltaVsToday = ms.projectedBalance - currentBalance;
          const facts: KeyDriverFact[] =
            ms.driverFacts && ms.driverFacts.length > 0
              ? ms.driverFacts.slice(0, 2)
              : [{ kind: 'noData' }];

          return (
            <button
              key={ms.month}
              ref={el => {
                cardRefs.current[index] = el;
              }}
              data-index={index}
              type="button"
              onClick={() => onSelectMilestone(ms.month)}
              aria-pressed={isHighlighted}
              className={`w-[82%] shrink-0 snap-center sm:w-auto text-start bg-card rounded-2xl p-4 shadow-card border border-line border-s-4 ${cfg.stripe} flex flex-col gap-3 transition-all ${
                isHighlighted ? 'ring-2 ring-brand-600 shadow-raised' : 'hover:border-brand-600/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    {getMilestoneHorizonLabel(ms.month)}
                  </div>
                  <div className="text-xs text-ink-400">{ms.label}</div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${cfg.badge}`}
                >
                  <StatusIcon size={14} strokeWidth={1.75} aria-hidden="true" />
                  <span>{cfg.text}</span>
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold text-ink-900">
                  <Money amount={ms.projectedBalance} />
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                  <span>{darija.vision.vsToday}:</span>
                  <span
                    className={`font-semibold ${
                      deltaVsToday >= 0 ? 'text-positive-600' : 'text-negative-600'
                    }`}
                  >
                    <Money amount={deltaVsToday} signed showCurrency={false} />
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-line w-full space-y-1">
                <p className="text-[11px] font-medium text-ink-400">
                  {darija.vision.keyDriversLabel}
                </p>
                <ul className="space-y-1">
                  {facts.map((fact, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-ink-600 flex items-center gap-1.5 truncate"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-ink-400/50 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{renderDriverFact(fact)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
        {milestones.map((ms, idx) => (
          <span
            key={ms.month}
            className={`h-1.5 rounded-full transition-all ${
              activeSlide === idx ? 'w-5 bg-brand-600' : 'w-1.5 bg-line'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
