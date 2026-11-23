// miZan — Hero Balance Card & Subtle Local-First Privacy Indicator
import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { darija } from '../i18n/darija';
import { daysSince, formatRelativeDate, t } from '../i18n/t';
import { Money } from './ui/Money';

const VISIT_COUNT_KEY = 'mizan-visit-count';
const STALE_DAYS_THRESHOLD = 7;

interface HeroBalanceCardProps {
  currentBalance: number;
  freeCashflow: number;
  balanceUpdatedAt: number | null;
  onQuickCheckin: () => void;
}

export function HeroBalanceCard({
  currentBalance,
  freeCashflow,
  balanceUpdatedAt,
  onQuickCheckin,
}: HeroBalanceCardProps) {
  const [referenceNow] = useState(() => new Date());
  const [showFullPrivacy] = useState(() => {
    try {
      const count = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0');
      return !Number.isFinite(count) || count < 3;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      const count = Number(localStorage.getItem(VISIT_COUNT_KEY) || '0');
      const next = Number.isFinite(count) ? count + 1 : 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(next));
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const relativeDate = formatRelativeDate(balanceUpdatedAt, referenceNow);
  const ageDays = daysSince(balanceUpdatedAt, referenceNow);
  const isStale = ageDays !== null && ageDays >= STALE_DAYS_THRESHOLD;

  return (
    <div className="space-y-2.5">
      <section
        aria-label={darija.checkin.currentBalance}
        className="bg-linear-to-bl from-brand-700 to-brand-600 text-white rounded-2xl p-5 sm:p-6 shadow-raised space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-white/80 font-medium">{darija.checkin.currentBalance}</p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight">
              <Money amount={currentBalance} />
            </p>
          </div>

          {relativeDate ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                isStale
                  ? 'bg-warning-50 text-warning-600'
                  : 'bg-white/15 text-white/95'
              }`}
            >
              {isStale ? (
                <AlertTriangle size={14} strokeWidth={1.75} aria-hidden="true" />
              ) : null}
              <span>{t(darija.checkin.lastUpdated, { when: relativeDate })}</span>
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/15">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/80">{darija.checkin.monthlyFreeCashflow}:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-semibold ${
                freeCashflow >= 0
                  ? 'bg-positive-50 text-positive-600'
                  : 'bg-negative-50 text-negative-600'
              }`}
            >
              <Money amount={freeCashflow} signed />
            </span>
          </div>

          <button
            type="button"
            onClick={onQuickCheckin}
            className="px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 min-h-[44px] shadow-card"
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{darija.nav.quickCheckin}</span>
          </button>
        </div>
      </section>

      <div className="flex justify-start">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-line text-xs text-ink-600 shadow-card"
          title={darija.privacy.badge}
          aria-label={darija.privacy.badge}
        >
          <ShieldCheck size={15} strokeWidth={1.75} className="text-brand-600 shrink-0" aria-hidden="true" />
          {showFullPrivacy ? <span>{darija.privacy.badge}</span> : null}
        </div>
      </div>
    </div>
  );
}
