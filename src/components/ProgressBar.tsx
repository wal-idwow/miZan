// miZan — Progress Bar Component (Green/Red visualization)
import { darija } from '../i18n/darija';
import { formatDH } from '../utils/format';

interface ProgressBarProps {
  pct: number;
  saved: number;
  total: number;
  monthlySlice: number;
  label?: string;
}

export function ProgressBar({ pct, saved, total, monthlySlice, label }: ProgressBarProps) {
  const clampedPct = Math.min(100, Math.max(0, pct));

  return (
    <div className="w-full" role="progressbar" aria-valuenow={Math.round(clampedPct)} aria-valuemin={0} aria-valuemax={100} aria-label={label || `Progress ${Math.round(clampedPct)}%`}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-green-700">{darija.items.progress.saved}: {formatDH(saved)}</span>
        <span className="text-red-700">{darija.items.progress.remaining}: {formatDH(total - saved)}</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${clampedPct}%` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent pointer-events-none" style={{ width: `${100 - clampedPct}%`, left: `${clampedPct}%` }} />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>{darija.items.progress.monthlySlice}: {formatDH(monthlySlice)}</span>
        <span className="font-medium">{Math.round(clampedPct)}%</span>
      </div>
    </div>
  );
}