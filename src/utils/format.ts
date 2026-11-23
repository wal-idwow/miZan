// miZan — RTL-safe formatting and numeric parsing utilities
// All amounts in MAD (DH)
import { darija } from '../i18n/darija';
import { t } from '../i18n/t';

const DEFAULT_MAX_AMOUNT = 1_000_000_000;
const DEFAULT_MIN_BALANCE = -1_000_000_000;

function formatAbsInt(absInt: number): string {
  return new Intl.NumberFormat('ar-MA-u-nu-latn', {
    maximumFractionDigits: 0,
  }).format(absInt);
}

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

export function formatNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const rounded = Object.is(safe, -0) ? 0 : safe;
  if (rounded < 0) return `-${formatAbsInt(Math.abs(rounded))}`;
  return formatAbsInt(rounded);
}

export function formatSignedNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const rounded = Object.is(safe, -0) ? 0 : safe;
  if (rounded > 0) return `+${formatAbsInt(rounded)}`;
  if (rounded < 0) return `-${formatAbsInt(Math.abs(rounded))}`;
  return '0';
}

export function formatPlainNumber(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.abs(Math.round(amount)) : 0;
  return formatAbsInt(safe);
}

export function formatCompactAmount(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const rounded = Object.is(safe, -0) ? 0 : safe;
  if (Math.abs(rounded) < 1000) {
    return formatNumber(rounded);
  }
  const absK = Math.abs(rounded) / 1000;
  const kStr = Number.isInteger(absK)
    ? String(absK)
    : absK.toFixed(1).replace(/\.0$/, '');
  const signedK = rounded < 0 ? `-${kStr}` : kStr;
  return t(darija.common.thousandShort, { n: `\u2066${signedK}\u2069` });
}

export function formatCurrencyText(
  amount: number,
  opts: { signed?: boolean } = {}
): string {
  const num = opts.signed ? formatSignedNumber(amount) : formatNumber(amount);
  return `\u2066${num}\u2069 ${darija.common.currency}`;
}

function normalizeDigits(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code >= 0x0660 && code <= 0x0669) {
      out += String.fromCharCode(48 + (code - 0x0660));
    } else if (code >= 0x06f0 && code <= 0x06f9) {
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
