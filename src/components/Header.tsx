// miZan — Header Component
import { darija } from '../i18n/darija';

interface HeaderProps {
  onQuickCheckin: () => void;
  onWhatIfToggle: () => void;
  showWhatIf: boolean;
}

export function Header({ onQuickCheckin, onWhatIfToggle, showWhatIf }: HeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-emerald-700 shrink-0"
            aria-hidden="true"
          >
            <path d="M12 3v18" />
            <path d="M5 7h14" />
            <path d="M3 14l2-7 2 7a2 2 0 0 1-4 0Z" />
            <path d="M17 14l2-7 2 7a2 2 0 0 1-4 0Z" />
            <path d="M8 21h8" />
          </svg>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-1.5">
            <span>{darija.app.name}</span>
            <span className="text-gray-300 font-normal" aria-hidden="true">
              —
            </span>
            <bdi dir="ltr" className="text-base font-semibold text-emerald-700">
              {darija.app.brandLatin}
            </bdi>
          </h1>
        </div>
        <p className="text-sm text-gray-500 hidden sm:block">{darija.app.tagline}</p>
      </div>
      <div className="border-t px-4 py-2 flex flex-wrap gap-2 text-sm max-w-4xl mx-auto">
        <button
          type="button"
          onClick={onQuickCheckin}
          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 min-h-[44px]"
        >
          {darija.nav.quickCheckin}
        </button>
        <button
          type="button"
          onClick={onWhatIfToggle}
          className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 min-h-[44px]"
        >
          {showWhatIf ? darija.whatIf.hide : darija.whatIf.show}
        </button>
      </div>
    </header>
  );
}
