'use client';

import { useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { t } from '@/lib/i18n';

interface FlipDevicePromptProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function FlipDevicePrompt({ isVisible, onConfirm, onCancel }: FlipDevicePromptProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    dialogRef.current?.focus();

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onCancel]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-2xl animate-slide-up outline-none"
      >
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange/10">
          <svg className="h-8 w-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 id="confirm-title" className="mb-2 text-center text-xl font-bold text-text-primary">
          {t('confirmOrder')}
        </h2>
        <p className="mb-8 text-center text-sm text-text-secondary">
          {t('orderReceivedConfirm')}
        </p>

        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {t('cancel')}
            </Button>
          )}
          <Button onClick={onConfirm} className="flex-1">
            {t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
