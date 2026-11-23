// miZan — Saved and Remaining Track Bar
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';
import { Money } from './ui/Money';

interface ProgressBarProps {
  pct: number;
  saved: number;
  total: number;
  monthlySlice: number;
  itemName?: string;
  label?: string;
}

export function ProgressBar({
  pct,
  saved,
  total,
  monthlySlice,
  itemName,
  label,
}: ProgressBarProps) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const roundedPct = Math.round(clampedPct);
  const ariaLabel =
    label ||
    (itemName
      ? t(darija.a11y.progressBar, { name: itemName, percent: roundedPct })
      : t(darija.a11y.progressFallback, { percent: roundedPct }));

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuenow={roundedPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className="flex justify-between text-xs mb-1 gap-2">
        <span className="text-green-700">
          {darija.items.progress.saved}: <Money amount={saved} />
        </span>
        <span className="text-red-700">
          {darija.items.progress.remaining}: <Money amount={Math.max(0, total - saved)} />
        </span>
      </div>
      <div className="h-3 bg-rose-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 gap-2">
        <span>
          {darija.items.progress.monthlySlice}: <Money amount={monthlySlice} />
        </span>
        <span className="font-medium tabular-nums">
          <bdi dir="ltr">{roundedPct}%</bdi>
        </span>
      </div>
    </div>
  );
}
