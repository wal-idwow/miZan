// miZan — Unobtrusive Install Banner (docked above mobile BottomNav)
import { Download } from 'lucide-react';
import { darija } from '../i18n/darija';

interface InstallBannerProps {
  visible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallBanner({ visible, onInstall, onDismiss }: InstallBannerProps) {
  if (!visible) return null;

  return (
    <aside
      aria-label={darija.pwa.installTitle}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 inset-x-4 sm:inset-x-auto sm:start-4 sm:w-96 z-20 animate-slide-up"
    >
      <div className="bg-card border border-line rounded-2xl p-3.5 shadow-raised flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <Download size={18} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink-900 truncate">{darija.pwa.installTitle}</p>
            <p className="text-xs text-ink-600 truncate">{darija.pwa.installDesc}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className="px-2.5 py-2 text-xs font-medium text-ink-600 hover:text-ink-900 rounded-xl min-h-[44px]"
          >
            {darija.pwa.later}
          </button>
          <button
            type="button"
            onClick={onInstall}
            className="px-3.5 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 min-h-[44px]"
          >
            {darija.pwa.installButton}
          </button>
        </div>
      </div>
    </aside>
  );
}
