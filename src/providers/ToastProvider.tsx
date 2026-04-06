'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useToast } from '@/hooks/useToast';

type ToastCtx = ReturnType<typeof useToast>;

const ToastContext = createContext<ToastCtx | null>(null);

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toast.toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl px-5 py-3 text-white shadow-lg animate-slide-up ${
            toast.toast.type === 'success' ? 'bg-success' : 'bg-error'
          }`}
        >
          <span className="text-sm font-medium">{toast.toast.message}</span>
          <button
            onClick={toast.dismiss}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
