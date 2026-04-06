'use client';

import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-xl',
        size === 'sm' && 'h-9 px-4 text-sm',
        size === 'md' && 'h-12 px-6 text-base',
        size === 'lg' && 'h-14 px-8 text-lg',
        !isDisabled && variant === 'primary' && 'bg-brand-orange text-white hover:bg-brand-orange/90',
        !isDisabled && variant === 'secondary' && 'bg-brand-dark text-white hover:bg-brand-dark-light',
        !isDisabled && variant === 'outline' && 'border-2 border-border bg-white text-text-primary hover:bg-gray-50',
        !isDisabled && variant === 'ghost' && 'bg-transparent text-text-secondary hover:bg-white',
        !isDisabled && variant === 'danger' && 'bg-error text-white hover:bg-error/90',
        isDisabled && 'bg-brand-orange/30 text-white cursor-not-allowed',
        !isDisabled && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
