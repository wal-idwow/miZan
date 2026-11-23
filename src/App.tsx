import { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { darija } from './i18n/darija';
import { t } from './i18n/t';
import { useHashRoute } from './hooks/useHashRoute';
import { usePersistentFinance } from './hooks/usePersistentFinance';
import { useToast } from './hooks/useToast';
import { useInstallPrompt } from './pwa/useInstallPrompt';
import { useServiceWorker } from './pwa/useServiceWorker';
import { toStoredData } from './state/financeReducer';
import { selectBaselineForecast, selectMonthlyFreeCashflow, selectWhatIfDelta } from './state/selectors';
import { loadPreImportSnapshot, savePreImportSnapshot, shareOrExportBackupFile } from './storage/storage';
import { formatCurrencyText } from './utils/format';
import { AppShell } from './components/layout/AppShell';
import { InstallBanner } from './components/InstallBanner';
import { QuickCheckinModal } from './components/QuickCheckinModal';
import { UpdateToast } from './components/UpdateToast';
import { Toast } from './components/ui/Toast';
import { OverviewScreen } from './screens/OverviewScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { DataScreen } from './screens/DataScreen';
import type { BaselineInput, StoredData, StoredItem, WhatIfScenario } from './types/finance';

const IosInstallSheet = lazy(() => import('./components/IosInstallSheet'));

export default function App() {
  const { tab, pendingCheckin, consumePendingCheckin, navigate } = useHashRoute();
  const [manualCheckin, setManualCheckin] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  const handleCrossTabSync = useCallback(() => showToast(darija.data.storage.otherTab), [showToast]);
  const { state, dispatch, storageStatus, dismissRecovered, downloadRecovered, resetAll } =
    usePersistentFinance({ onCrossTabSync: handleCrossTabSync });

  const hasUserData =
    state.items.length > 0 || state.baseline.currentBalance !== 0 || state.baseline.fixedSalary !== 0;
  const sw = useServiceWorker();
  const install = useInstallPrompt({
    engaged: hasUserData || state.revision > 0,
    onInstalled: useCallback(() => showToast(darija.pwa.installedToast), [showToast]),
  });

  const forecast = useMemo(() => selectBaselineForecast(state.baseline, state.items), [state.baseline, state.items]);
  const delta = useMemo(() => selectWhatIfDelta(state.baseline, state.items, state.whatIf), [state.baseline, state.items, state.whatIf]);
  const freeCashflow = selectMonthlyFreeCashflow(forecast);

  const handleExport = useCallback(async () => {
    await shareOrExportBackupFile(toStoredData(state));
    dispatch({ type: 'MARK_EXPORTED' });
  }, [state, dispatch]);

  const handleImportConfirmed = useCallback((data: StoredData) => {
    savePreImportSnapshot(toStoredData(state));
    dispatch({ type: 'IMPORT_DATA', data });
    showToast(darija.data.importSuccess, {
      label: darija.data.importUndo,
      onAction: () => { const snap = loadPreImportSnapshot(); if (snap) dispatch({ type: 'IMPORT_DATA', data: snap }); },
    });
  }, [state, dispatch, showToast]);

  const handleAddPayment = useCallback((id: string, amount: number) => {
    const existing = state.items.find(i => i.id === id);
    if (!existing || amount <= 0) return;
    const prevSaved = existing.alreadySaved;
    const applied = Math.min(amount, Math.max(0, existing.totalAmount - prevSaved));
    dispatch({ type: 'ADD_PAYMENT', id, amount });
    showToast(t(darija.items.progress.paymentToast, { amount: formatCurrencyText(applied), name: existing.name }), {
      label: darija.common.undo,
      onAction: () => dispatch({ type: 'RESTORE_ITEM_SAVED', id, alreadySaved: prevSaved }),
    });
  }, [state.items, dispatch, showToast]);

  const handleInstallClick = useCallback(async () => {
    const outcome = await install.promptInstall();
    if (outcome === 'ios') setIosSheetOpen(true);
  }, [install]);

  const isCheckinOpen = manualCheckin || pendingCheckin;
  const closeCheckin = () => { setManualCheckin(false); consumePendingCheckin(); };

  return (
    <>
      <UpdateToast
        needRefresh={sw.needRefresh}
        offlineReady={sw.offlineReady}
        isOffline={sw.isOffline}
        onApplyUpdate={sw.applyUpdate}
        onDismissUpdate={sw.dismissUpdate}
        onDismissOfflineReady={sw.dismissOfflineReady}
      />
      <AppShell
        activeTab={tab}
        onNavigate={navigate}
        onQuickCheckin={() => setManualCheckin(true)}
        storageStatus={storageStatus}
        onExport={handleExport}
        onDownloadRecovered={downloadRecovered}
        onDismissRecovered={dismissRecovered}
      >
        {tab === 'overview' ? (
          <OverviewScreen
            baseline={state.baseline}
            balanceUpdatedAt={state.balanceUpdatedAt}
            freeCashflow={freeCashflow}
            forecast={forecast}
            whatIf={state.whatIf}
            delta={delta}
            onQuickCheckin={() => setManualCheckin(true)}
            onWhatIfChange={(whatIf: WhatIfScenario) => dispatch({ type: 'SET_WHAT_IF', whatIf })}
            onWhatIfReset={() => { dispatch({ type: 'RESET_WHAT_IF' }); showToast(darija.whatIf.resetToast); }}
            onWhatIfApply={() => { dispatch({ type: 'APPLY_WHAT_IF' }); showToast(darija.whatIf.appliedToast); }}
          />
        ) : null}
        {tab === 'goals' ? (
          <GoalsScreen
            items={state.items}
            forecast={forecast}
            onAdd={(item: StoredItem) => dispatch({ type: 'ADD_ITEM', item })}
            onUpdate={(item: StoredItem) => dispatch({ type: 'UPDATE_ITEM', item })}
            onDelete={id => dispatch({ type: 'DELETE_ITEM', id })}
            onAddPayment={handleAddPayment}
          />
        ) : null}
        {tab === 'budget' ? (
          <BudgetScreen
            baseline={state.baseline}
            forecast={forecast}
            freeCashflow={freeCashflow}
            onBillsChange={fixedBills => dispatch({ type: 'UPDATE_BILLS', fixedBills })}
            onBucketsChange={variableBuckets => dispatch({ type: 'UPDATE_BUCKETS', variableBuckets })}
          />
        ) : null}
        {tab === 'data' ? (
          <DataScreen
            itemsCount={state.items.length}
            hasUserData={hasUserData}
            lastExportAt={state.meta.lastExportAt}
            canInstall={install.canInstall}
            onInstallApp={handleInstallClick}
            onExport={handleExport}
            onImportConfirmed={handleImportConfirmed}
            onImportError={msg => showToast(msg)}
            onLoadDemo={() => { dispatch({ type: 'LOAD_DEMO' }); showToast(darija.data.demoLoaded); }}
            onClearAll={resetAll}
          />
        ) : null}
        <QuickCheckinModal
          isOpen={isCheckinOpen}
          onClose={closeCheckin}
          baseline={state.baseline}
          onSave={(baseline: BaselineInput) => { dispatch({ type: 'UPDATE_BASELINE', baseline }); showToast(darija.checkin.savedToast); }}
        />
        <InstallBanner visible={install.showBanner && !toast} onInstall={handleInstallClick} onDismiss={install.dismissBanner} />
        <Suspense fallback={null}>
          {iosSheetOpen ? <IosInstallSheet isOpen={iosSheetOpen} onClose={() => setIosSheetOpen(false)} /> : null}
        </Suspense>
        <Toast toast={toast} onDismiss={dismissToast} />
      </AppShell>
    </>
  );
}
