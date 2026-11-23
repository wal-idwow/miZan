// miZan — Accessible Native Dialog Sheet Primitive
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { darija } from '../../i18n/darija';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  variant?: 'sheet' | 'dialog';
  maxWidthClass?: string;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdrop = true,
  variant = 'sheet',
  maxWidthClass = 'max-w-md',
}: SheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement;
      }
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      if (prev && prev.isConnected) {
        prev.focus();
      }
    }
  }, [isOpen]);

  const positionClass =
    variant === 'sheet'
      ? 'items-end sm:items-center justify-center p-0 sm:p-4'
      : 'items-center justify-center p-4';

  const panelRoundedClass =
    variant === 'sheet'
      ? 'rounded-t-3xl sm:rounded-2xl animate-slide-up pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6'
      : 'rounded-2xl animate-slide-down pb-6';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={e => {
        e.preventDefault();
        onClose();
      }}
      onClick={e => {
        if (closeOnBackdrop && e.target === dialogRef.current) {
          onClose();
        }
      }}
      className={`mizan-sheet open:flex ${positionClass}`}
    >
      {isOpen ? (
        <div
          dir="rtl"
          className={`bg-card w-full ${maxWidthClass} ${panelRoundedClass} px-5 pt-4 sm:p-6 shadow-raised max-h-[90dvh] overflow-y-auto`}
          onClick={e => e.stopPropagation()}
        >
          {variant === 'sheet' ? (
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-3 sm:hidden" aria-hidden="true" />
          ) : null}
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 id={titleId} className="text-lg font-bold text-ink-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-400 hover:text-ink-900 hover:bg-surface min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors"
              aria-label={darija.a11y.closeDialog}
            >
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
