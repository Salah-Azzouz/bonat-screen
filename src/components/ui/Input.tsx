'use client';

import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validationState?: 'valid' | 'invalid' | 'idle';
  label?: string;
  suffix?: string;
}

export function Input({
  validationState = 'idle',
  label,
  suffix,
  className,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={clsx(
            'w-full h-12 rounded-xl border bg-surface ps-4 pe-10 text-base text-text-primary outline-none transition-all',
            'placeholder:text-text-muted',
            'focus:ring-2 focus:ring-brand-orange/30 focus:border-border-focus',
            validationState === 'valid' && 'border-success',
            validationState === 'invalid' && 'border-error',
            validationState === 'idle' && 'border-border',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute inset-inline-end-4 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
            {suffix}
          </span>
        )}
        {!suffix && validationState !== 'idle' && (
          <span
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
            className={clsx(
              'text-lg pointer-events-none',
              validationState === 'valid' && 'text-success',
              validationState === 'invalid' && 'text-error',
            )}
          >
            {validationState === 'valid' ? '\u2713' : '\u2717'}
          </span>
        )}
      </div>
    </div>
  );
}
