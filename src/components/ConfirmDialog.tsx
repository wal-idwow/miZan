// miZan — Confirmation Dialog (replaces native confirm)
import { darija } from '../i18n/darija';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary';
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, variant = 'destructive' }: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmStyles = variant === 'destructive'
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-emerald-600 text-white hover:bg-emerald-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 id="confirm-title" className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label={darija.a11y.closeModal}>×</button>
        </div>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]">{cancelText || darija.common.cancel}</button>
          <button onClick={onConfirm} className={`px-4 py-2 ${confirmStyles} rounded-lg font-medium min-h-[44px]`}>{confirmText || darija.common.confirm}</button>
        </div>
      </div>
    </div>
  );
}