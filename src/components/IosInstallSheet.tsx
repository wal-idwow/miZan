// miZan — iOS Safari "Add to Home Screen" Guide Sheet (lazy-loaded)
import { Share, ShieldCheck, SquarePlus } from 'lucide-react';
import { darija } from '../i18n/darija';
import { Sheet } from './ui/Sheet';

interface IosInstallSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IosInstallSheet({ isOpen, onClose }: IosInstallSheetProps) {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={darija.pwa.iosTitle} variant="sheet">
      <div className="space-y-4">
        <ol className="space-y-3">
          <li className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-line">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Share size={20} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-ink-900">{darija.pwa.iosStep1}</span>
          </li>
          <li className="flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-line">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <SquarePlus size={20} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-ink-900">{darija.pwa.iosStep2}</span>
          </li>
        </ol>

        <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-600/15 flex items-start gap-2.5 text-xs text-brand-700">
          <ShieldCheck size={16} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{darija.pwa.iosPrivacyNote}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 min-h-[44px]"
        >
          {darija.common.close}
        </button>
      </div>
    </Sheet>
  );
}
