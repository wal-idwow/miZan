import { describe, it, expect } from 'vitest';
import { MAX_AMOUNT, MAX_ITEMS, MIN_BALANCE, parseStoredData } from './schema';
import { parseMoneyInput } from '../utils/format';

const rawFixtures = import.meta.glob('./fixtures/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function getFixtureRaw(name: string): string {
  const entry = Object.entries(rawFixtures).find(([path]) => path.endsWith(`/${name}`));
  if (!entry) throw new Error(`Missing fixture: ${name}`);
  return entry[1];
}

const now = new Date(2026, 10, 23); // 2026-11-23

describe('Schema Validator (parseStoredData) & Fixtures', () => {
  it('migrates valid-v1.json to schema v2', () => {
    const res = parseStoredData(JSON.parse(getFixtureRaw('valid-v1.json')), now);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.migratedFrom).toBe(1);
    expect(res.data.schemaVersion).toBe(2);
    expect(res.data.items[0].targetDate).toBe('2027-02');
    expect(res.data.items[1].targetDate).toBe('2027-09');
  });

  it('accepts valid-v2.json cleanly', () => {
    const res = parseStoredData(JSON.parse(getFixtureRaw('valid-v2.json')), now);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.migratedFrom).toBeUndefined();
    expect(res.data.meta.lastExportAt).toBe(1700000000000);
  });

  it('rejects future-version.json with futureVersion code', () => {
    const res = parseStoredData(JSON.parse(getFixtureRaw('future-version.json')), now);
    expect(res).toMatchObject({ ok: false, code: 'futureVersion' });
  });

  it('rejects partial-baseline.json with invalidShape code', () => {
    const res = parseStoredData(JSON.parse(getFixtureRaw('partial-baseline.json')), now);
    expect(res).toMatchObject({ ok: false, code: 'invalidShape' });
  });

  it('rejects string-numbers.json with invalidShape code', () => {
    const res = parseStoredData(JSON.parse(getFixtureRaw('string-numbers.json')), now);
    expect(res).toMatchObject({ ok: false, code: 'invalidShape' });
  });

  it('strips __proto__/constructor/unknown keys on prototype-pollution.json without polluting Object.prototype', () => {
    const parsedJson = JSON.parse(getFixtureRaw('prototype-pollution.json'));
    const res = parseStoredData(parsedJson, now);
    expect(res.ok).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
    if (res.ok) {
      expect('extraUnknown' in res.data).toBe(false);
    }
  });

  it('rejects bad-item-target.json with invalidShape code', () => {
    const res = parseStoredData(JSON.parse(getFixtureRaw('bad-item-target.json')), now);
    expect(res).toMatchObject({ ok: false, code: 'invalidShape' });
  });

  it('throws on corrupt-syntax.json when JSON.parse is invoked', () => {
    expect(() => JSON.parse(getFixtureRaw('corrupt-syntax.json'))).toThrow();
  });

  it('defaults missing-whatif.json to empty whatIf object', () => {
    const res = parseStoredData(JSON.parse(getFixtureRaw('missing-whatif.json')), now);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.whatIf).toEqual({});
    }
  });

  it('rejects non-object roots and invalid schemaVersion values', () => {
    expect(parseStoredData(null, now)).toMatchObject({ ok: false, code: 'notObject' });
    expect(parseStoredData([], now)).toMatchObject({ ok: false, code: 'notObject' });
    expect(parseStoredData('hello', now)).toMatchObject({ ok: false, code: 'notObject' });
    expect(parseStoredData({ schemaVersion: 0 }, now)).toMatchObject({
      ok: false,
      code: 'invalidShape',
    });
    expect(parseStoredData({ schemaVersion: 1.5 }, now)).toMatchObject({
      ok: false,
      code: 'invalidShape',
    });
  });

  it('validates baseline bounds, negative currentBalance, and missing leaf defaults', () => {
    const negBal = parseStoredData(
      {
        schemaVersion: 2,
        baseline: {
          currentBalance: -2500,
          fixedBills: {},
          variableBuckets: {},
        },
        items: [],
      },
      now
    );
    expect(negBal.ok).toBe(true);
    if (negBal.ok) {
      expect(negBal.data.baseline.currentBalance).toBe(-2500);
      expect(negBal.data.baseline.fixedSalary).toBe(0);
      expect(negBal.data.baseline.fixedBills.rent).toBe(0);
    }

    expect(
      parseStoredData(
        {
          schemaVersion: 2,
          baseline: {
            fixedSalary: -10,
            fixedBills: {},
            variableBuckets: {},
          },
          items: [],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });

    expect(
      parseStoredData(
        {
          schemaVersion: 2,
          baseline: {
            fixedSalary: MAX_AMOUNT + 1,
            fixedBills: {},
            variableBuckets: {},
          },
          items: [],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });

    expect(
      parseStoredData(
        {
          schemaVersion: 2,
          baseline: {
            currentBalance: MIN_BALANCE - 1,
            fixedBills: {},
            variableBuckets: {},
          },
          items: [],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });

    expect(
      parseStoredData(
        {
          schemaVersion: 2,
          baseline: { fixedBills: {}, variableBuckets: 'bad' },
          items: [],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });
  });

  it('enforces item cap, deduplicates IDs, and validates all item fields', () => {
    const validBase = {
      schemaVersion: 2,
      baseline: { fixedBills: {}, variableBuckets: {} },
    };

    const tooMany = Array.from({ length: MAX_ITEMS + 1 }, (_, idx) => ({
      id: `id-${idx}`,
      name: 'Goal',
      category: 'goal',
      totalAmount: 100,
      targetDate: '2027-01',
    }));
    expect(parseStoredData({ ...validBase, items: tooMany }, now)).toMatchObject({
      ok: false,
      code: 'invalidShape',
    });

    const dupIds = parseStoredData(
      {
        ...validBase,
        items: [
          { id: 'dup', name: 'A', category: 'goal', totalAmount: 100, targetDate: '2027-01' },
          { id: 'dup', name: 'B', category: 'debt', totalAmount: 200, targetDate: '2027-02' },
        ],
      },
      now
    );
    expect(dupIds.ok).toBe(true);
    if (dupIds.ok) {
      expect(dupIds.data.items[0].id).toBe('dup');
      expect(dupIds.data.items[1].id).not.toBe('dup');
    }

    expect(
      parseStoredData(
        {
          ...validBase,
          items: [{ id: '', name: 'A', category: 'goal', totalAmount: 100, targetDate: '2027-01' }],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });

    expect(
      parseStoredData(
        {
          ...validBase,
          items: [{ id: '1', name: '   ', category: 'goal', totalAmount: 100, targetDate: '2027-01' }],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });

    expect(
      parseStoredData(
        {
          ...validBase,
          items: [{ id: '1', name: 'A', category: 'invalid', totalAmount: 100, targetDate: '2027-01' }],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });

    expect(
      parseStoredData(
        {
          ...validBase,
          items: [{ id: '1', name: 'A', category: 'goal', targetDate: '2027-01' }],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });

    expect(
      parseStoredData(
        {
          schemaVersion: 1,
          baseline: { fixedBills: {}, variableBuckets: {} },
          items: [{ id: '1', name: 'A', category: 'goal', totalAmount: 100, targetMonth: 121 }],
        },
        now
      )
    ).toMatchObject({ ok: false, code: 'invalidShape' });
  });

  it('validates and clamps whatIf, meta, balanceUpdatedAt, and updatedAt', () => {
    const validBase = {
      schemaVersion: 2,
      baseline: { fixedBills: {}, variableBuckets: {} },
      items: [],
    };

    const clampedWhatIf = parseStoredData(
      {
        ...validBase,
        whatIf: {
          extraMonthlySaving: -200,
          extraMonthlyExpense: -400,
          variableSpendingCutPct: 140,
        },
      },
      now
    );
    expect(clampedWhatIf.ok).toBe(true);
    if (clampedWhatIf.ok) {
      expect(clampedWhatIf.data.whatIf).toEqual({
        extraMonthlySaving: 0,
        extraMonthlyExpense: 400,
        variableSpendingCutPct: 100,
      });
    }

    expect(parseStoredData({ ...validBase, whatIf: null }, now)).toMatchObject({
      ok: false,
      code: 'invalidShape',
    });
    expect(
      parseStoredData({ ...validBase, whatIf: { extraMonthlySaving: '500' } }, now)
    ).toMatchObject({ ok: false, code: 'invalidShape' });
    expect(parseStoredData({ ...validBase, updatedAt: -1 }, now)).toMatchObject({
      ok: false,
      code: 'invalidShape',
    });
    expect(parseStoredData({ ...validBase, balanceUpdatedAt: -1 }, now)).toMatchObject({
      ok: false,
      code: 'invalidShape',
    });
    expect(parseStoredData({ ...validBase, meta: { lastExportAt: -1 } }, now)).toMatchObject({
      ok: false,
      code: 'invalidShape',
    });
  });
});

describe('parseMoneyInput', () => {
  it('parses Arabic-Indic, Eastern Arabic-Indic, grouped numbers, and empty drafts', () => {
    expect(parseMoneyInput('٥٠٠٠')).toBe(5000);
    expect(parseMoneyInput('۱۲٬۳۴۵')).toBe(12345);
    expect(parseMoneyInput('5.000')).toBe(5000);
    expect(parseMoneyInput('123.6')).toBe(124);
    expect(parseMoneyInput('')).toBeNull();
    expect(parseMoneyInput('   ')).toBeNull();
    expect(parseMoneyInput('-')).toBeNull();
    expect(parseMoneyInput('-250', { allowNegative: true })).toBe(-250);
    expect(parseMoneyInput('-250', { allowNegative: false })).toBe(0);
    expect(parseMoneyInput('150', { min: 0, max: 100 })).toBe(100);
  });
});
