'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showOk?: boolean;
  onOk?: () => void;
  onBack?: () => void;
}

export function Header({ title, showBack = true, showOk, onOk, onBack }: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-12 w-12 items-center justify-center rounded-xl hover:bg-bg transition-colors"
          >
            <svg
              className="h-5 w-5 text-text-primary rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
      </div>
      {showOk && (
        <button
          onClick={onOk}
          className="flex h-12 items-center rounded-xl px-5 text-sm font-semibold text-brand-orange hover:bg-brand-orange/5 transition-colors"
        >
          OK
        </button>
      )}
    </header>
  );
}
