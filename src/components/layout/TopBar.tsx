// miZan — Sticky Top Bar (shrinks on scroll, tablet inline tab pills)
import { useEffect, useState } from 'react';
import { RefreshCw, Scale } from 'lucide-react';
import { darija } from '../../i18n/darija';
import type { TabRoute } from '../../utils/routes';
import { NAV_ITEMS } from './navItems';

interface TopBarProps {
  activeTab: TabRoute;
  onNavigate: (tab: TabRoute) => void;
  onQuickCheckin: () => void;
}

export function TopBar({ activeTab, onNavigate, onQuickCheckin }: TopBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-line transition-all ${
        scrolled ? 'shadow-card' : ''
      }`}
    >
      <div
        className={`max-w-6xl mx-auto px-4 flex items-center justify-between gap-3 transition-all ${
          scrolled ? 'py-2' : 'py-3'
        }`}
      >
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
            <Scale size={20} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-ink-900 flex items-center gap-1.5 leading-tight">
              <span>{darija.app.name}</span>
              <span className="text-line font-normal" aria-hidden="true">
                —
              </span>
              <bdi dir="ltr" className="text-sm font-semibold text-brand-600">
                {darija.app.brandLatin}
              </bdi>
            </h1>
            {!scrolled ? (
              <p className="text-xs text-ink-600 hidden sm:block">{darija.app.tagline}</p>
            ) : null}
          </div>
        </div>

        <nav
          aria-label={darija.a11y.mainNav}
          className="hidden md:flex lg:hidden items-center gap-1 bg-surface p-1 rounded-xl"
        >
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 min-h-[44px] transition-colors ${
                  active
                    ? 'bg-card text-brand-700 shadow-card'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <p className="text-sm font-medium text-ink-600">
            {NAV_ITEMS.find(i => i.id === activeTab)?.label}
          </p>
        </div>

        {activeTab !== 'overview' ? (
          <button
            type="button"
            onClick={onQuickCheckin}
            className="px-3.5 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center shrink-0"
            aria-label={darija.nav.quickCheckin}
          >
            <RefreshCw size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">{darija.nav.quickCheckin}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
