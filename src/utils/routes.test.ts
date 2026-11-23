import { describe, it, expect } from 'vitest';
import { parseHashRoute, tabToHash } from './routes';

describe('Hash Route Parser', () => {
  it('parses all supported routes and defaults unknown hashes to overview', () => {
    expect(parseHashRoute('')).toEqual({ tab: 'overview', openCheckin: false });
    expect(parseHashRoute('#/')).toEqual({ tab: 'overview', openCheckin: false });
    expect(parseHashRoute('#/goals')).toEqual({ tab: 'goals', openCheckin: false });
    expect(parseHashRoute('#/goals/')).toEqual({ tab: 'goals', openCheckin: false });
    expect(parseHashRoute('#/budget?x=1')).toEqual({ tab: 'budget', openCheckin: false });
    expect(parseHashRoute('#/data')).toEqual({ tab: 'data', openCheckin: false });
    expect(parseHashRoute('#/checkin')).toEqual({ tab: 'overview', openCheckin: true });
    expect(parseHashRoute('#/unknown')).toEqual({ tab: 'overview', openCheckin: false });
  });

  it('converts tab routes back to canonical hashes', () => {
    expect(tabToHash('overview')).toBe('#/');
    expect(tabToHash('goals')).toBe('#/goals');
    expect(tabToHash('budget')).toBe('#/budget');
    expect(tabToHash('data')).toBe('#/data');
  });
});
