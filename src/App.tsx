import { useCallback, useMemo, useState } from 'react';
import { darija } from './i18n/darija';
import { t } from './i18n/t';
import { usePersistentFinance } from './hooks/usePersistentFinance';
import { useToast } from './hooks/useToast';
import { toStoredData } from './state/financeReducer';
import {
  selectBaselineForecast,
  selectMonthlyFreeCashflow,
  selectWhatIfDelta,
} from './state/selectors';
import {
  exportBackupFile,
  loadPreImportSnapshot,
  parseImportFile,
  savePreImportSnapshot,
} from './storage/storage';
import { formatCurrencyText } from './utils/format';
import { Header } from './components/Header';
import { StorageStatusBanner } from './components/StorageStatusBanner';
import { TopSummary } from './components/TopSummary';
import { MilestoneCards } from './components/MilestoneCards';
import { TimelineChart } from './components/TimelineChart';
import { WhatIfPanel } from './components/WhatIfPanel';
import { ItemList } from './components/ItemList';
import { BudgetSections } from './components/BudgetSections';
import { DataPersistence } from './components/DataPersistence';
import { QuickCheckinModal } from './components/QuickCheckinModal';
import { Toast } from './components/ui/Toast';
import type { BaselineInput, StoredItem, WhatIfScenario } from './types/finance';

export default function App() {
  const [showCheckin, setShowCheckin] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  const handleCrossTabSync = useCallback(() => showToast(darija.data.storage.otherTab), [showToast]);
  const { state, dispatch, storageStatus, dismissRecovered, downloadRecovered, resetAll } =
    usePersistentFinance({ onCrossTabSync: handleCrossTabSync });

  const forecast = useMemo(
    () => selectBaselineForecast(state.baseline, state.items),
    [state.baseline, state.items]
  );
  const delta = useMemo(
    () => selectWhatIfDelta(state.baseline, state.items, state.whatIf),
    [state.baseline, state.items, state.whatIf]
  );
  const freeCashflow = selectMonthlyFreeCashflow(forecast);

  const handleExport = useCallback(() => {
    exportBackupFile(toStoredData(state));
    dispatch({ type: 'MARK_EXPORTED' });
  }, [state, dispatch]);

  const handleImport = useCallback(async (file: File) => {
    const result = await parseImportFile(file);
    if (!result.ok) {
      showToast(darija.data.importErrors[result.code]);
      return;
    }
    savePreImportSnapshot(toStoredData(state));
    dispatch({ type: 'IMPORT_DATA', data: result.data });
    showToast(darija.data.importSuccess, {
      label: darija.data.importUndo,
      onAction: () => {
        const snap = loadPreImportSnapshot();
        if (snap) dispatch({ type: 'IMPORT_DATA', data: snap });
      },
    });
  }, [state, dispatch, showToast]);

  const handleAddPayment = useCallback((id: string, amount: number) => {
    const existing = state.items.find(i => i.id === id);
    if (!existing || amount <= 0) return;
    const prevSaved = existing.alreadySaved;
    const appliedAmount = Math.min(amount, Math.max(0, existing.totalAmount - prevSaved));
    dispatch({ type: 'ADD_PAYMENT', id, amount });
    showToast(
      t(darija.items.progress.paymentToast, {
        amount: formatCurrencyText(appliedAmount),
        name: existing.name,
      }),
      {
        label: darija.common.undo,
        onAction: () => dispatch({ type: 'RESTORE_ITEM_SAVED', id, alreadySaved: prevSaved }),
      }
    );
  }, [state.items, dispatch, showToast]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Header
        onQuickCheckin={() => setShowCheckin(true)}
        onWhatIfToggle={() => setShowWhatIf(prev => !prev)}
        showWhatIf={showWhatIf}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        <StorageStatusBanner
          status={storageStatus}
          onExport={handleExport}
          onDownloadRecovered={downloadRecovered}
          onDismissRecovered={dismissRecovered}
        />
        <TopSummary baseline={state.baseline} freeCashflow={freeCashflow} itemsCount={state.items.length} />
        <MilestoneCards milestones={forecast.milestones} />
        <TimelineChart monthly={forecast.monthly} currentBalance={state.baseline.currentBalance} />
        <WhatIfPanel
          whatIf={state.whatIf}
          onChange={(whatIf: WhatIfScenario) => dispatch({ type: 'SET_WHAT_IF', whatIf })}
          onReset={() => { dispatch({ type: 'RESET_WHAT_IF' }); showToast(darija.whatIf.resetToast); }}
          onApply={() => { dispatch({ type: 'APPLY_WHAT_IF' }); showToast(darija.whatIf.appliedToast); }}
          delta={delta}
          isOpen={showWhatIf}
          onToggle={() => setShowWhatIf(prev => !prev)}
        />
        <ItemList
          items={state.items}
          onAdd={(item: StoredItem) => dispatch({ type: 'ADD_ITEM', item })}
          onUpdate={(item: StoredItem) => dispatch({ type: 'UPDATE_ITEM', item })}
          onDelete={id => dispatch({ type: 'DELETE_ITEM', id })}
          onAddPayment={handleAddPayment}
          forecast={forecast}
        />
        <BudgetSections
          bills={state.baseline.fixedBills}
          onBillsChange={fixedBills => dispatch({ type: 'UPDATE_BILLS', fixedBills })}
          buckets={state.baseline.variableBuckets}
          onBucketsChange={variableBuckets => dispatch({ type: 'UPDATE_BUCKETS', variableBuckets })}
        />
        <DataPersistence
          onExport={handleExport}
          onImport={handleImport}
          onLoadDemo={() => { dispatch({ type: 'LOAD_DEMO' }); showToast(darija.data.demoLoaded); }}
          onClearAll={resetAll}
        />
      </main>

      <QuickCheckinModal
        isOpen={showCheckin}
        onClose={() => setShowCheckin(false)}
        baseline={state.baseline}
        onSave={(baseline: BaselineInput) => { dispatch({ type: 'UPDATE_BASELINE', baseline }); showToast(darija.checkin.savedToast); }}
      />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
