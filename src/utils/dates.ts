// miZan — Calendar month utilities for YYYY-MM target dates
const YEAR_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isValidYearMonth(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = YEAR_MONTH_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  return year >= 1970 && year <= 2200;
}

export function toYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function addMonthsToYearMonth(baseDate: Date, offsetMonths: number): string {
  const safeOffset = Number.isFinite(offsetMonths) ? Math.floor(offsetMonths) : 0;
  const target = new Date(baseDate.getFullYear(), baseDate.getMonth() + safeOffset, 1);
  return toYearMonth(target);
}

export function monthsBetween(baseDate: Date, targetDate: string): number {
  const match = YEAR_MONTH_RE.exec(targetDate);
  if (!match) return 0;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  return (year - baseDate.getFullYear()) * 12 + (monthIndex - baseDate.getMonth());
}

export function formatYearMonth(targetDate: string): string {
  const match = YEAR_MONTH_RE.exec(targetDate);
  if (!match) return targetDate;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  return new Date(year, monthIndex, 1).toLocaleDateString('ar-MA', {
    month: 'long',
    year: 'numeric',
  });
}

export interface TargetMonthOption {
  value: string;
  label: string;
}

export function buildTargetMonthOptions(
  baseDate: Date = new Date(),
  count: number = 24,
  includeDate?: string
): TargetMonthOption[] {
  const options: TargetMonthOption[] = [];
  const seen = new Set<string>();

  for (let offset = 1; offset <= count; offset++) {
    const value = addMonthsToYearMonth(baseDate, offset);
    seen.add(value);
    options.push({
      value,
      label: formatYearMonth(value),
    });
  }

  if (includeDate && isValidYearMonth(includeDate) && !seen.has(includeDate)) {
    const diff = monthsBetween(baseDate, includeDate);
    const entry = { value: includeDate, label: formatYearMonth(includeDate) };
    if (diff <= 0) {
      options.unshift(entry);
    } else {
      options.push(entry);
    }
  }

  return options;
}
