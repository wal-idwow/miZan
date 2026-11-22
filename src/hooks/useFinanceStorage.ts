// miZan — Schema-versioned localStorage hook
import { useCallback } from 'react';
import type { BaselineInput, FinanceItem, WhatIfScenario, StoredData } from '../types/finance';
import { STORAGE_KEY, CURRENT_SCHEMA_VERSION, EMPTY_BASELINE, EMPTY_WHAT_IF } from '../types/finance';

export function useFinanceStorage() {
  const load = useCallback((): { baseline: BaselineInput; items: FinanceItem[]; whatIf: WhatIfScenario } => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredData = JSON.parse(raw);
        if (parsed.schemaVersion === CURRENT_SCHEMA_VERSION) {
          return { baseline: parsed.baseline, items: parsed.items, whatIf: parsed.whatIf };
        }
      }
    } catch (e) {
      console.warn('Failed to load data:', e);
    }
    return { baseline: EMPTY_BASELINE, items: [], whatIf: EMPTY_WHAT_IF };
  }, []);

  const save = useCallback((baseline: BaselineInput, items: FinanceItem[], whatIf: WhatIfScenario) => {
    try {
      const data: StoredData = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        baseline,
        items,
        whatIf,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, []);

  return { load, save };
}

// Re-export constants for convenience
export { STORAGE_KEY, CURRENT_SCHEMA_VERSION, EMPTY_BASELINE, EMPTY_WHAT_IF } from '../types/finance';