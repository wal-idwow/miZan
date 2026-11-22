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
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">⚖️</span>
          <h1 className="text-xl font-bold text-gray-900">{darija.app.name}</h1>
        </div>
        <p className="text-sm text-gray-500 hidden sm:block">{darija.app.tagline}</p>
      </div>
      <div className="border-t px-4 py-2 flex flex-wrap gap-2 text-sm">
        <button onClick={onQuickCheckin} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 min-h-[44px]">{darija.nav.quickCheckin}</button>
        <button onClick={onWhatIfToggle} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 min-h-[44px]">{showWhatIf ? 'طمس' : 'إظهار'} {darija.whatIf.livePreview}</button>
      </div>
    </header>
  );
}