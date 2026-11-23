// miZan — Desktop Inline-Start Sidebar (>= 1024px)
import { RefreshCw, Scale, ShieldCheck } from 'lucide-react';
import { darija } from '../../i18n/darija';
import type { TabRoute } from '../../utils/routes';
import { NAV_ITEMS } from './navItems';

interface SideNavProps {
  activeTab: TabRoute;
  onNavigate: (tab: TabRoute) => void;
  onQuickCheckin: () => void;
}

export function SideNav({ activeTab, onNavigate, onQuickCheckin }: SideNavProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-e border-line bg-card min-h-screen sticky top-0 max-h-screen p-5 justify-between">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
            <Scale size={22} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink-900 flex items-center gap-1.5 leading-tight">
              <span>{darija.app.name}</span>
              <span className="text-line font-normal" aria-hidden="true">
                —
              </span>
              <bdi dir="ltr" className="text-sm font-semibold text-brand-600">
                {darija.app.brandLatin}
              </bdi>
            </h1>
            <p className="text-xs text-ink-600">{darija.app.tagline}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onQuickCheckin}
          className="w-full py-3 px-4 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-card"
        >
          <RefreshCw size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{darija.nav.quickCheckin}</span>
        </button>

        <nav aria-label={darija.a11y.mainNav} className="space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 min-h-[44px] transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-ink-600 hover:bg-surface hover:text-ink-900'
                }`}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-50 flex items-start gap-2.5 text-xs text-brand-700">
        <ShieldCheck size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>{darija.privacy.badge}</span>
      </div>
    </aside>
  );
}
