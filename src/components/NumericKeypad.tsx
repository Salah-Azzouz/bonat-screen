'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { t } from '@/lib/i18n';

interface NumericKeypadProps {
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
  placeholder?: string;
  maxLength?: number;
  submitLabel?: string;
}

export function NumericKeypad({ onSubmit, onCancel, loading, title, placeholder = '0', maxLength = 15, submitLabel }: NumericKeypadProps) {
  const [value, setValue] = useState('');

  const handleKey = (key: string) => {
    if (value.length >= maxLength) return;
    setValue((v) => v + key);
  };

  const handleBackspace = () => setValue((v) => v.slice(0, -1));
  const handleClear = () => setValue('');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div className="w-full max-w-xs mx-auto">
      {title && (
        <h3 className="text-center text-sm font-medium text-text-secondary mb-3">{title}</h3>
      )}

      {/* Display */}
      <div className="mb-4 rounded-xl bg-surface border border-border p-4 text-center">
        <p className="text-3xl font-bold tracking-widest text-text-primary min-h-[44px]" dir="ltr">
          {value || <span className="text-text-muted">{placeholder}</span>}
        </p>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => {
              if (key === '⌫') handleBackspace();
              else if (key === 'C') handleClear();
              else handleKey(key);
            }}
            className={`h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 ${
              key === '⌫'
                ? 'bg-surface border border-border text-text-secondary hover:bg-gray-100'
                : key === 'C'
                  ? 'bg-surface border border-border text-error hover:bg-error/5'
                  : 'bg-surface border border-border text-text-primary hover:bg-gray-50 active:bg-brand-orange/10'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('cancel')}
          </Button>
        )}
        <Button
          onClick={() => { onSubmit(value); setValue(''); }}
          loading={loading}
          disabled={value.length === 0}
          className="flex-1"
        >
          {submitLabel || t('done')}
        </Button>
      </div>
    </div>
  );
}
