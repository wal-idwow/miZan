import { describe, it, expect } from 'vitest';
import {
  formatCompactAmount,
  formatCurrencyText,
  formatDH,
  formatNumber,
  formatPct,
  formatPlainNumber,
  formatSignedNumber,
} from './format';

describe('RTL Formatting Utilities', () => {
  it('formatNumber formats integers with Latin digits and Moroccan grouping', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-0)).toBe('0');
    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(5000)).toBe('5.000');
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(-500)).toBe('-500');
    expect(formatNumber(Number.NaN)).toBe('0');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('0');
  });

  it('formatSignedNumber applies explicit +, -, and neutral 0 cleanly', () => {
    expect(formatSignedNumber(0)).toBe('0');
    expect(formatSignedNumber(-0)).toBe('0');
    expect(formatSignedNumber(0.4)).toBe('0');
    expect(formatSignedNumber(4500)).toBe('+4.500');
    expect(formatSignedNumber(-4500)).toBe('-4.500');
    expect(formatSignedNumber(-0.6)).toBe('-1');
  });

  it('formatPlainNumber formats absolute rounded values', () => {
    expect(formatPlainNumber(-5000)).toBe('5.000');
    expect(formatPlainNumber(123.6)).toBe('124');
  });

  it('formatCompactAmount abbreviates thousands cleanly with bidi isolation', () => {
    expect(formatCompactAmount(0)).toBe('0');
    expect(formatCompactAmount(750)).toBe('750');
    expect(formatCompactAmount(15000)).toBe('\u206615\u2069 ألف');
    expect(formatCompactAmount(1500)).toBe('\u20661.5\u2069 ألف');
    expect(formatCompactAmount(-2500)).toBe('\u2066-2.5\u2069 ألف');
    expect(formatCompactAmount(Number.NaN)).toBe('0');
  });

  it('formatCurrencyText wraps numeric run in LRI/PDI with درهم suffix', () => {
    expect(formatCurrencyText(5000)).toBe('\u20665.000\u2069 درهم');
    expect(formatCurrencyText(5000, { signed: true })).toBe('\u2066+5.000\u2069 درهم');
    expect(formatCurrencyText(-250, { signed: true })).toBe('\u2066-250\u2069 درهم');
  });

  it('preserves formatDH and formatPct legacy compatibility', () => {
    expect(formatDH(5000)).toContain('5.000');
    expect(formatDH(5000)).toContain('د.م.');
    expect(formatPct(45.6)).toBe('46%');
  });
});
