// miZan — Type-safe Template Interpolation & Arabic Plural Helpers
import { darija } from './darija';

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
