// miZan — RTL-safe formatting and numeric parsing utilities
// All amounts in MAD (DH)

const DEFAULT_MAX_AMOUNT = 1_000_000_000;
const DEFAULT_MIN_BALANCE = -1_000_000_000;

export function formatDH(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatPct(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${Math.round(safe)}%`;
}

export function formatSignedNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(Math.round(safe));
  const formatted = new Intl.NumberFormat('ar-MA').format(abs);
  if (safe > 0) return `+${formatted}`;
  if (safe < 0) return `-${formatted}`;
  return formatted;
}

export function formatPlainNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('ar-MA').format(Math.abs(Math.round(safe)));
}

function normalizeDigits(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    // Arabic-Indic digits U+0660..U+0669
    if (code >= 0x0660 && code <= 0x0669) {
      out += String.fromCharCode(48 + (code - 0x0660));
    } else if (code >= 0x06f0 && code <= 0x06f9) {
      // Eastern Arabic-Indic digits U+06F0..U+06F9
      out += String.fromCharCode(48 + (code - 0x06f0));
    } else {
      out += input[i];
    }
  }
  return out;
}

export interface ParseMoneyOptions {
  min?: number;
  max?: number;
  allowNegative?: boolean;
}

/**
 * Parses user-entered currency strings into clamped integer dirhams.
 * Supports ASCII and Arabic-Indic numerals, grouping separators, and empty drafts.
 */
export function parseMoneyInput(
  raw: string,
  opts: ParseMoneyOptions = {}
): number | null {
  const normalized = normalizeDigits(raw)
    .replace(/[\s\u00A0\u202F,\u066C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/\u066B/g, '.');

  if (normalized === '' || normalized === '-' || normalized === '+') {
    return null;
  }

  let numericStr = normalized;
  if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(numericStr)) {
    numericStr = numericStr.replace(/\./g, '');
  }

  if (!/^[+-]?\d+(\.\d+)?$/.test(numericStr)) {
    return null;
  }

  const parsed = Number(numericStr);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const allowNegative = opts.allowNegative ?? false;
  const min = opts.min ?? (allowNegative ? DEFAULT_MIN_BALANCE : 0);
  const max = opts.max ?? DEFAULT_MAX_AMOUNT;

  const rounded = Math.round(parsed);
  const clamped = Math.min(max, Math.max(min, rounded));
  return Object.is(clamped, -0) ? 0 : clamped;
}
