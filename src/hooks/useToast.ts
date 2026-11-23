// miZan — Toast State Hook
import { useCallback, useRef, useState } from 'react';
import type { ToastData } from '../components/ui/Toast';

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, action?: { label: string; onAction: () => void }) => {
      idRef.current += 1;
      setToast({
        id: idRef.current,
        message,
        actionLabel: action?.label,
        onAction: action?.onAction,
      });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, showToast, dismissToast };
}
