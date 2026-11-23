// miZan — Data, Backup, Privacy & Danger Zone Tab Screen
import { useState } from 'react';
import {
  AlertTriangle,
  Download,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { darija } from '../i18n/darija';
import { daysSince, formatRelativeDate, t } from '../i18n/t';
import { parseImportFile } from '../storage/storage';
import type { StoredData } from '../types/finance';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Sheet } from '../components/ui/Sheet';

interface DataScreenProps {
  itemsCount: number;
  hasUserData: boolean;
  lastExportAt: number | null;
  onExport: () => void;
  onImportConfirmed: (data: StoredData) => void;
  onImportError: (message: string) => void;
  onLoadDemo: () => void;
  onClearAll: () => void;
}

export function DataScreen({
  itemsCount,
  hasUserData,
  lastExportAt,
  onExport,
  onImportConfirmed,
  onImportError,
  onLoadDemo,
  onClearAll,
}: DataScreenProps) {
  const [referenceNow] = useState(() => new Date());
  const [importPreview, setImportPreview] = useState<StoredData | null>(null);
  const [demoConfirm, setDemoConfirm] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const canWebShare =
    typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';
  const relativeExport = formatRelativeDate(lastExportAt, referenceNow);
  const exportDays = daysSince(lastExportAt, referenceNow);
  const showBackupNudge =
    hasUserData &&
    ((lastExportAt === null && itemsCount >= 2) ||
      (exportDays !== null && exportDays >= 30));

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const result = await parseImportFile(file);
    if (!result.ok) {
      onImportError(darija.data.importErrors[result.code]);
      return;
    }
    setImportPreview(result.data);
  };

  const formattedBackupDate = importPreview
    ? new Date(importPreview.updatedAt).toLocaleDateString('ar-MA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="space-y-5">
      <section className="bg-brand-50 border border-brand-600/15 rounded-2xl p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
          <ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-brand-700">{darija.privacy.badge}</h2>
          <p className="text-sm text-ink-600 leading-relaxed">{darija.privacy.long}</p>
        </div>
      </section>

      {showBackupNudge ? (
        <div className="bg-warning-50 border border-warning-600/20 rounded-2xl p-4 flex items-center gap-3 text-sm text-ink-900">
          <AlertTriangle size={18} strokeWidth={1.75} className="text-warning-600 shrink-0" aria-hidden="true" />
          <span>{darija.data.backupNudge}</span>
        </div>
      ) : null}

      <section
        className="bg-card rounded-2xl border border-line p-5 shadow-card space-y-4"
        aria-labelledby="backup-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 id="backup-title" className="text-base font-bold text-ink-900">
              {darija.data.exportTitle}
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">{darija.data.exportDesc}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-surface text-ink-600 font-medium">
            {relativeExport
              ? t(darija.data.lastExport, { when: relativeExport })
              : darija.data.neverExported}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onExport}
            className="p-4 border border-line rounded-xl hover:bg-surface transition-colors text-start min-h-[44px] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              {canWebShare ? (
                <Share2 size={18} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Download size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-900">
                {canWebShare ? darija.data.exportShare : darija.data.exportButton}
              </div>
              <div className="text-xs text-ink-400">{darija.data.exportFormat}</div>
            </div>
          </button>

          <label className="p-4 border border-line rounded-xl hover:bg-surface transition-colors text-start min-h-[44px] flex items-center gap-3 cursor-pointer focus-within:ring-2 focus-within:ring-brand-600">
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFilePick}
              className="sr-only"
            />
            <div className="w-10 h-10 rounded-xl bg-surface text-ink-600 flex items-center justify-center shrink-0">
              <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-900">{darija.data.importButton}</div>
              <div className="text-xs text-ink-400">{darija.data.importDesc}</div>
            </div>
          </label>
        </div>
      </section>

      <section className="bg-card rounded-2xl border border-line p-5 shadow-card space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
            <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-900">{darija.data.demoTitle}</h3>
            <p className="text-xs text-ink-600 mt-0.5">{darija.data.demoDesc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (hasUserData) {
              setDemoConfirm(true);
            } else {
              onLoadDemo();
            }
          }}
          className="w-full py-2.5 px-4 border border-brand-600/30 bg-brand-50 text-brand-700 rounded-xl text-sm font-semibold hover:bg-brand-600 hover:text-white transition-colors min-h-[44px]"
        >
          {darija.data.demoButton}
        </button>
      </section>

      <section className="bg-card rounded-2xl border border-negative-600/20 p-5 shadow-card space-y-3">
        <h3 className="text-base font-bold text-negative-600">{darija.data.dangerZone}</h3>
        <button
          type="button"
          onClick={() => setClearConfirm(true)}
          className="w-full py-2.5 px-4 border border-negative-600/30 text-negative-600 hover:bg-negative-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{darija.data.clearAll}</span>
        </button>
      </section>

      <p className="text-center text-xs text-ink-400">
        {t(darija.data.version, { v: __APP_VERSION__ })}
      </p>

      <Sheet
        isOpen={importPreview !== null}
        onClose={() => setImportPreview(null)}
        title={darija.data.importConfirmTitle}
        variant="dialog"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            {t(darija.data.importConfirmBody, {
              items: importPreview?.items.length ?? 0,
              date: formattedBackupDate,
            })}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setImportPreview(null)}
              className="flex-1 py-2.5 px-4 border border-line rounded-xl text-ink-600 font-medium hover:bg-surface min-h-[44px]"
            >
              {darija.common.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                if (importPreview) {
                  onImportConfirmed(importPreview);
                  setImportPreview(null);
                }
              }}
              className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 min-h-[44px]"
            >
              {darija.data.importConfirm}
            </button>
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        isOpen={demoConfirm}
        onClose={() => setDemoConfirm(false)}
        onConfirm={() => {
          setDemoConfirm(false);
          onLoadDemo();
        }}
        title={darija.data.demoConfirmTitle}
        message={darija.data.demoConfirm}
        confirmText={darija.data.demoButton}
        cancelText={darija.common.cancel}
        variant="primary"
      />

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={() => {
          setClearConfirm(false);
          onClearAll();
        }}
        title={darija.data.clearConfirmTitle}
        message={darija.data.clearConfirm}
        confirmText={darija.common.yes}
        cancelText={darija.common.no}
        variant="destructive"
      />
    </div>
  );
}
