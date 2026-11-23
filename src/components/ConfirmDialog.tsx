// miZan — Confirmation Dialog (built on accessible Sheet primitive)
import { darija } from '../i18n/darija';
import { Sheet } from './ui/Sheet';

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

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'destructive',
}: ConfirmDialogProps) {
  const confirmStyles =
    variant === 'destructive'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-emerald-600 text-white hover:bg-emerald-700';

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title} variant="dialog" closeOnBackdrop>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 min-h-[44px]"
        >
          {cancelText || darija.common.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 ${confirmStyles} rounded-lg font-medium min-h-[44px]`}
        >
          {confirmText || darija.common.confirm}
        </button>
      </div>
    </Sheet>
  );
}
