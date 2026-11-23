// miZan — Local Storage Resilience & Recovery Banners
import { AlertTriangle } from 'lucide-react';
import { darija } from '../i18n/darija';
import type { StorageStatus } from '../hooks/usePersistentFinance';

interface StorageStatusBannerProps {
  status: StorageStatus;
  onExport: () => void;
  onDownloadRecovered: () => void;
  onDismissRecovered: () => void;
}

export function StorageStatusBanner({
  status,
  onExport,
  onDownloadRecovered,
  onDismissRecovered,
}: StorageStatusBannerProps) {
  const showUnavailable = status.mode === 'memory' || status.saveError === 'unavailable';
  const showFull = status.saveError === 'quota';
  const showCorrupt = status.corruptBackup !== null;

  if (!showUnavailable && !showFull && !showCorrupt) return null;

  return (
    <div className="space-y-2" role="region" aria-live="polite">
      {showUnavailable ? (
        <div className="bg-warning-50 border border-warning-600/20 text-ink-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertTriangle size={18} strokeWidth={1.75} className="text-warning-600 shrink-0" aria-hidden="true" />
            <p>{darija.data.storage.unavailable}</p>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="px-3.5 py-2 bg-warning-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 min-h-[44px]"
          >
            {darija.data.exportButton}
          </button>
        </div>
      ) : null}

      {showFull ? (
        <div className="bg-negative-50 border border-negative-600/20 text-ink-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertTriangle size={18} strokeWidth={1.75} className="text-negative-600 shrink-0" aria-hidden="true" />
            <p>{darija.data.storage.full}</p>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="px-3.5 py-2 bg-negative-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 min-h-[44px]"
          >
            {darija.data.exportButton}
          </button>
        </div>
      ) : null}

      {showCorrupt ? (
        <div className="bg-warning-50 border border-warning-600/20 text-ink-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertTriangle size={18} strokeWidth={1.75} className="text-warning-600 shrink-0" aria-hidden="true" />
            <p>{darija.data.storage.recovered}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadRecovered}
              className="px-3.5 py-2 bg-warning-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 min-h-[44px]"
            >
              {darija.data.storage.downloadRecovered}
            </button>
            <button
              type="button"
              onClick={onDismissRecovered}
              className="px-3.5 py-2 border border-line bg-card text-ink-600 rounded-xl text-xs font-medium hover:bg-surface min-h-[44px]"
            >
              {darija.common.close}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
