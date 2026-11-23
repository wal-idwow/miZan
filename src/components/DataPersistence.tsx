// miZan — Data Persistence (Export/Import/Demo/Reset)
import { useState } from 'react';
import { darija } from '../i18n/darija';
import { ConfirmDialog } from './ConfirmDialog';

interface DataPersistenceProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onLoadDemo: () => void;
  onClearAll: () => void;
}

export function DataPersistence({
  onExport,
  onImport,
  onLoadDemo,
  onClearAll,
}: DataPersistenceProps) {
  const [clearConfirm, setClearConfirm] = useState(false);

  return (
    <section className="bg-white rounded-2xl border p-6 space-y-4" aria-labelledby="data-title">
      <h3 id="data-title" className="text-lg font-bold text-gray-900">
        {darija.data.exportTitle}
      </h3>
      <p className="text-sm text-gray-500">{darija.data.exportDesc}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onExport}
          className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-start min-h-[44px]"
        >
          <div className="font-medium text-gray-900">{darija.data.exportButton}</div>
          <div className="text-sm text-gray-500">{darija.data.exportFormat}</div>
        </button>

        <div className="relative">
          <input
            type="file"
            accept="application/json,.json"
            aria-label={darija.data.importTitle}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                onImport(file);
              }
              e.target.value = '';
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-start min-h-[44px] flex items-center justify-between gap-2">
            <div>
              <div className="font-medium text-gray-900">{darija.data.importButton}</div>
              <div className="text-sm text-gray-500">{darija.data.importDesc}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3">{darija.data.demoDesc}</p>
        <button
          type="button"
          onClick={onLoadDemo}
          className="w-full py-3 px-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors min-h-[44px]"
        >
          {darija.data.demoButton}
        </button>
      </div>

      <div className="pt-4 border-t border-gray-100 text-center">
        <button
          type="button"
          onClick={() => setClearConfirm(true)}
          className="text-sm text-red-500 hover:underline min-h-[44px]"
        >
          {darija.data.clearAll}
        </button>
      </div>

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={() => {
          onClearAll();
          setClearConfirm(false);
        }}
        title={darija.data.clearConfirmTitle}
        message={darija.data.clearConfirm}
        confirmText={darija.common.yes}
        cancelText={darija.common.no}
        variant="destructive"
      />
    </section>
  );
}
