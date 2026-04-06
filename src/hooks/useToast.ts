'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type ToastType = 'success' | 'error';

interface Toast {
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const show = useCallback((message: string, type: ToastType) => {
    clearTimer();
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const showSuccess = useCallback((message: string) => show(message, 'success'), [show]);
  const showError = useCallback((message: string) => show(message, 'error'), [show]);
  const dismiss = useCallback(() => { clearTimer(); setToast(null); }, []);

  return { toast, showSuccess, showError, dismiss };
}
