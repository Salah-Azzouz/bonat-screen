'use client';

import { useState, useEffect } from 'react';
import { getLocale, setLocale, type Locale } from '@/lib/i18n';

interface LanguageToggleProps {
  variant?: 'light' | 'dark';
}

export function LanguageToggle({ variant = 'light' }: LanguageToggleProps) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const toggle = () => {
    const newLocale: Locale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
    setLocaleState(newLocale);
    // Force re-render by reloading — simplest way to apply dir change
    window.location.reload();
  };

  const isDark = variant === 'dark';

  return (
    <button
      onClick={toggle}
      className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
        isDark
          ? 'text-white/60 hover:text-white hover:bg-white/5'
          : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
      }`}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      {locale === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
