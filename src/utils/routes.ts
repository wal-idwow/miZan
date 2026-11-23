// miZan — Lightweight Hash Route Parser

export type TabRoute = 'overview' | 'goals' | 'budget' | 'data';

export interface ParsedHashRoute {
  tab: TabRoute;
  openCheckin: boolean;
}

export function parseHashRoute(hash: string): ParsedHashRoute {
  const normalized = hash.replace(/^#/, '').split('?')[0].replace(/\/+$/, '') || '/';

  switch (normalized) {
    case '/goals':
      return { tab: 'goals', openCheckin: false };
    case '/budget':
      return { tab: 'budget', openCheckin: false };
    case '/data':
      return { tab: 'data', openCheckin: false };
    case '/checkin':
      return { tab: 'overview', openCheckin: true };
    case '/':
    default:
      return { tab: 'overview', openCheckin: false };
  }
}

export function tabToHash(tab: TabRoute): string {
  switch (tab) {
    case 'goals':
      return '#/goals';
    case 'budget':
      return '#/budget';
    case 'data':
      return '#/data';
    case 'overview':
      return '#/';
  }
}
