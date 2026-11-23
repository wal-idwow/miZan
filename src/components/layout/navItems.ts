// miZan — Navigation Configuration
import type { LucideIcon } from 'lucide-react';
import { Database, LayoutDashboard, Target, Wallet } from 'lucide-react';
import { darija } from '../../i18n/darija';
import type { TabRoute } from '../../utils/routes';

export interface NavItemConfig {
  id: TabRoute;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: darija.nav.overview, icon: LayoutDashboard },
  { id: 'goals', label: darija.nav.goals, icon: Target },
  { id: 'budget', label: darija.nav.budget, icon: Wallet },
  { id: 'data', label: darija.nav.data, icon: Database },
];
