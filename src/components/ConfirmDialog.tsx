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
      ? 'bg-negative-600 text-white hover:opacity-90'
      : 'bg-brand-600 text-white hover:bg-brand-700';

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={title} variant="dialog" closeOnBackdrop>
      <p className="text-sm text-ink-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 border border-line rounded-xl text-ink-600 font-medium hover:bg-surface min-h-[44px]"
        >
          {cancelText || darija.common.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2.5 ${confirmStyles} rounded-xl font-semibold min-h-[44px]`}
        >
          {confirmText || darija.common.confirm}
        </button>
      </div>
    </Sheet>
  );
}
