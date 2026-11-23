// miZan — Mobile Bottom Navigation Bar (< 768px)
import { darija } from '../../i18n/darija';
import type { TabRoute } from '../../utils/routes';
import { NAV_ITEMS } from './navItems';

interface BottomNavProps {
  activeTab: TabRoute;
  onNavigate: (tab: TabRoute) => void;
}

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label={darija.a11y.mainNav}
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-md border-t border-line pb-safe"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto px-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[48px] rounded-xl transition-colors"
            >
              <span
                className={`px-3 py-1 rounded-full transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-ink-400'
                }`}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span
                className={`text-[11px] leading-tight ${
                  active ? 'font-semibold text-brand-700' : 'font-medium text-ink-600'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
