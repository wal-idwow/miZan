// miZan — Type-safe Template Interpolation & Arabic Plural Helpers
import { darija } from './darija';

const MS_PER_DAY = 86_400_000;

export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match
  );
}

export function formatMonthsRemaining(months: number): string {
  const safe = Number.isFinite(months) ? Math.floor(months) : 0;
  if (safe <= 0) return darija.items.progress.overdue;
  if (safe === 1) return darija.items.progress.monthsLeftOne;
  if (safe === 2) return darija.items.progress.monthsLeftTwo;
  if (safe <= 10) return t(darija.items.progress.monthsLeft, { n: safe });
  return t(darija.items.progress.monthsLeftMany, { n: safe });
}

export function daysSince(timestamp: number | null, now: Date = new Date()): number | null {
  if (timestamp === null || !Number.isFinite(timestamp)) return null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const then = new Date(timestamp);
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  return Math.max(0, Math.round((startOfToday - startOfThen) / MS_PER_DAY));
}

export function formatRelativeDate(
  timestamp: number | null,
  now: Date = new Date()
): string | null {
  const days = daysSince(timestamp, now);
  if (days === null) return null;
  if (days <= 0) return darija.checkin.today;
  if (days === 1) return darija.checkin.yesterday;
  if (days <= 10) return t(darija.checkin.daysAgo, { n: days });
  return t(darija.checkin.daysAgoMany, { n: days });
}
