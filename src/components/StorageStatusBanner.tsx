// miZan — Local Storage Resilience & Recovery Banners
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
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">{darija.data.storage.unavailable}</p>
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 min-h-[44px]"
          >
            {darija.data.exportButton}
          </button>
        </div>
      ) : null}

      {showFull ? (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">{darija.data.storage.full}</p>
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 min-h-[44px]"
          >
            {darija.data.exportButton}
          </button>
        </div>
      ) : null}

      {showCorrupt ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">{darija.data.storage.recovered}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadRecovered}
              className="px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 min-h-[44px]"
            >
              {darija.data.storage.downloadRecovered}
            </button>
            <button
              type="button"
              onClick={onDismissRecovered}
              className="px-3 py-2 border border-amber-300 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-100 min-h-[44px]"
            >
              {darija.common.close}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
