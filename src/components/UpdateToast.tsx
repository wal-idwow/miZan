// miZan — PWA Update Prompt & Offline Status Indicator
import { useEffect } from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { darija } from '../i18n/darija';

interface UpdateToastProps {
  needRefresh: boolean;
  offlineReady: boolean;
  isOffline: boolean;
  onApplyUpdate: () => void;
  onDismissUpdate: () => void;
  onDismissOfflineReady: () => void;
}

export function UpdateToast({
  needRefresh,
  offlineReady,
  isOffline,
  onApplyUpdate,
  onDismissUpdate,
  onDismissOfflineReady,
}: UpdateToastProps) {
  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => {
      onDismissOfflineReady();
    }, 4000);
    return () => clearTimeout(timer);
  }, [offlineReady, onDismissOfflineReady]);

  return (
    <>
      {isOffline ? (
        <div
          role="status"
          aria-live="polite"
          className="bg-ink-900 text-white text-xs py-2 px-4 flex items-center justify-center gap-2"
        >
          <WifiOff size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>{darija.pwa.offline}</span>
        </div>
      ) : null}

      {needRefresh ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-4 inset-x-4 sm:inset-x-auto sm:end-4 sm:w-96 z-50 animate-slide-up"
        >
          <div className="bg-brand-700 text-white px-4 py-3 rounded-2xl shadow-raised flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-sm font-medium min-w-0">
              <RefreshCw size={16} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{darija.pwa.updateAvailable}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onApplyUpdate}
                className="px-3 py-1.5 bg-white text-brand-700 rounded-xl text-xs font-bold hover:bg-brand-50 min-h-[36px]"
              >
                {darija.pwa.reload}
              </button>
              <button
                type="button"
                onClick={onDismissUpdate}
                aria-label={darija.common.close}
                className="p-1.5 text-white/80 hover:text-white rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : offlineReady ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-4 inset-x-4 sm:inset-x-auto sm:end-4 sm:w-96 z-40 animate-slide-up"
        >
          <div className="bg-ink-900 text-white px-4 py-3 rounded-xl shadow-raised text-sm">
            {darija.pwa.offlineReady}
          </div>
        </div>
      ) : null}
    </>
  );
}
