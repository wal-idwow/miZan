// miZan — Managed Toast Notification with optional Undo action
import { useEffect } from 'react';

export interface ToastData {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.durationMs ?? (toast.onAction ? 6000 : 3500);
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-4 sm:w-96 z-50 animate-slide-down"
      role="status"
      aria-live="polite"
    >
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3">
        <span className="text-sm">{toast.message}</span>
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-1 min-h-[36px] shrink-0"
          >
            {toast.actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
