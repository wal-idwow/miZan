// miZan — Slim 8px Logical Two-Tone Progress Track
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import { Money } from './ui/Money';

interface ProgressBarProps {
  pct: number;
  saved: number;
  total: number;
  itemName?: string;
  label?: string;
}

export function ProgressBar({
  pct,
  saved,
  total,
  itemName,
  label,
}: ProgressBarProps) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const roundedPct = Math.round(clampedPct);
  const remaining = Math.max(0, total - saved);
  const ariaLabel =
    label ||
    (itemName
      ? t(darija.a11y.progressBar, { name: itemName, percent: roundedPct })
      : t(darija.a11y.progressFallback, { percent: roundedPct }));

  return (
    <div
      className="w-full space-y-1.5"
      role="progressbar"
      aria-valuenow={roundedPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className="flex justify-between items-center text-xs gap-2">
        <span className="text-positive-600 font-medium">
          {darija.items.progress.saved}: <Money amount={saved} />
        </span>
        <span className="text-ink-600">
          {darija.items.progress.remaining}: <Money amount={remaining} />
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-2 bg-negative-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-positive-600 transition-all duration-500 rounded-full"
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-ink-600 tabular-nums shrink-0">
          <bdi dir="ltr">{roundedPct}%</bdi>
        </span>
      </div>
    </div>
  );
}
