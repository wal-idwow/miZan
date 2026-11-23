// miZan — Responsive App Shell
import type { ReactNode } from 'react';
import type { StorageStatus } from '../../hooks/usePersistentFinance';
import type { TabRoute } from '../../utils/routes';
import { StorageStatusBanner } from '../StorageStatusBanner';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

interface AppShellProps {
  activeTab: TabRoute;
  onNavigate: (tab: TabRoute) => void;
  onQuickCheckin: () => void;
  storageStatus: StorageStatus;
  onExport: () => void;
  onDownloadRecovered: () => void;
  onDismissRecovered: () => void;
  children: ReactNode;
}

export function AppShell({
  activeTab,
  onNavigate,
  onQuickCheckin,
  storageStatus,
  onExport,
  onDownloadRecovered,
  onDismissRecovered,
  children,
}: AppShellProps) {
  return (
    <div dir="rtl" className="min-h-dvh bg-surface text-ink-900 flex">
      <SideNav
        activeTab={activeTab}
        onNavigate={onNavigate}
        onQuickCheckin={onQuickCheckin}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeTab={activeTab}
          onNavigate={onNavigate}
          onQuickCheckin={onQuickCheckin}
        />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-5 bottom-nav-clearance">
          <StorageStatusBanner
            status={storageStatus}
            onExport={onExport}
            onDownloadRecovered={onDownloadRecovered}
            onDismissRecovered={onDismissRecovered}
          />
          {children}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
