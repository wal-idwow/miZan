// miZan — Data Persistence (Export/Import/Demo)
import { useState } from 'react';
import { darija } from '../i18n/darija';
import { ConfirmDialog } from './ConfirmDialog';
import { STORAGE_KEY } from '../types/finance';

interface DataPersistenceProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onLoadDemo: () => void;
}

export function DataPersistence({ onExport, onImport, onLoadDemo }: DataPersistenceProps) {
  const [clearConfirm, setClearConfirm] = useState(false);

  return (
    <section className="bg-white rounded-2xl border p-6 space-y-4" aria-labelledby="data-title">
      <h3 id="data-title" className="text-lg font-bold text-gray-900">{darija.data.exportTitle}</h3>
      <p className="text-sm text-gray-500">{darija.data.exportDesc}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={onExport} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-right min-h-[44px]">
          <div className="font-medium text-gray-900">{darija.data.exportButton}</div>
          <div className="text-sm text-gray-500">JSON backup</div>
        </button>

        <div className="relative">
          <input type="file" accept=".json" onChange={e => { if (e.target.files?.[0]) onImport(e.target.files[0]); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <label className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-right cursor-pointer min-h-[44px] flex items-center justify-between">
            <div className="font-medium text-gray-900">{darija.data.importButton}</div>
            <div className="text-sm text-gray-500">{darija.data.importDesc}</div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3">{darija.data.demoDesc}</p>
        <button onClick={onLoadDemo} className="w-full py-3 px-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors min-h-[44px]">
          {darija.data.demoButton}
        </button>
      </div>

      <div className="pt-4 border-t border-gray-100 text-center">
        <button onClick={() => setClearConfirm(true)} className="text-sm text-red-500 hover:underline min-h-[44px]">{darija.data.clearAll}</button>
      </div>

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
        title={darija.data.clearAll}
        message={darija.data.clearConfirm}
        confirmText={darija.common.yes}
        cancelText={darija.common.no}
        variant="destructive"
      />
    </section>
  );
}