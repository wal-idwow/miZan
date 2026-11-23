import { describe, it, expect } from 'vitest';
import { darija } from './darija';
import { daysSince, formatMonthsRemaining, formatRelativeDate, t } from './t';

function collectLeafStrings(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj];
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).flatMap(collectLeafStrings);
  }
  return [];
}

describe('i18n template helper (t) & Darija dictionary', () => {
  it('interpolates single and multiple variables safely', () => {
    expect(t('باقي {n} شهور', { n: 4 })).toBe('باقي 4 شهور');
    expect(t('تزادت {amount} لـ«{name}»', { amount: '500 درهم', name: 'السفر' })).toBe(
      'تزادت 500 درهم لـ«السفر»'
    );
  });

  it('preserves unknown placeholders and ignores prototype keys', () => {
    expect(t('مرحبا {unknown}', { name: 'علي' })).toBe('مرحبا {unknown}');
    expect(t('{toString} {constructor}', {})).toBe('{toString} {constructor}');
  });

  it('treats $& and $$ in replacement values literally', () => {
    expect(t('قيمة: {val}', { val: '$& $$ $1' })).toBe('قيمة: $& $$ $1');
  });

  it('formats remaining months with proper Arabic agreement', () => {
    expect(formatMonthsRemaining(-2)).toBe(darija.items.progress.overdue);
    expect(formatMonthsRemaining(0)).toBe(darija.items.progress.overdue);
    expect(formatMonthsRemaining(1)).toBe('باقي شهر واحد');
    expect(formatMonthsRemaining(2)).toBe('باقي شهرين');
    expect(formatMonthsRemaining(3)).toBe('باقي 3 شهور');
    expect(formatMonthsRemaining(10)).toBe('باقي 10 شهور');
    expect(formatMonthsRemaining(11)).toBe('باقي 11 شهر');
    expect(formatMonthsRemaining(24)).toBe('باقي 24 شهر');
  });

  it('contains zero emojis, zero What-If strings, and uses الخلصة instead of الصالير', () => {
    const allStrings = collectLeafStrings(darija);
    const emojiRe = /\p{Extended_Pictographic}/u;
    for (const str of allStrings) {
      expect(emojiRe.test(str), `Unexpected emoji in: ${str}`).toBe(false);
      expect(str).not.toContain('What-If');
      expect(str).not.toContain('الصالير');
    }
    expect(darija.checkin.fixedSalary).toContain('الخلصة');
  });

  it('computes daysSince and formatRelativeDate in natural Moroccan Darija', () => {
    const now = new Date(2026, 10, 23, 18, 0);
    expect(daysSince(null, now)).toBeNull();
    expect(formatRelativeDate(null, now)).toBeNull();

    const todayTs = new Date(2026, 10, 23, 8, 0).getTime();
    expect(daysSince(todayTs, now)).toBe(0);
    expect(formatRelativeDate(todayTs, now)).toBe(darija.checkin.today);

    const yesterdayTs = new Date(2026, 10, 22, 23, 0).getTime();
    expect(daysSince(yesterdayTs, now)).toBe(1);
    expect(formatRelativeDate(yesterdayTs, now)).toBe(darija.checkin.yesterday);

    const fiveDaysAgoTs = new Date(2026, 10, 18, 10, 0).getTime();
    expect(formatRelativeDate(fiveDaysAgoTs, now)).toBe('قبل 5 يام');

    const twelveDaysAgoTs = new Date(2026, 10, 11, 10, 0).getTime();
    expect(formatRelativeDate(twelveDaysAgoTs, now)).toBe('قبل 12 يوم');
  });
});
