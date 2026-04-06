'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { useAuthStore } from '@/stores/auth-store';
import { LanguageToggle } from '@/components/LanguageToggle';
import { t } from '@/lib/i18n';

const SettingsIcon = ({ d }: { d: string }) => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export default function SettingsPage() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Header title={t('settings')} />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-lg space-y-2">
          <button onClick={() => router.push('/branches')} className="flex w-full items-center gap-4 rounded-xl bg-surface px-5 py-4 text-start transition-colors hover:bg-surface/80 border border-border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg text-text-muted">
              <SettingsIcon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </div>
            <span className="flex-1 font-medium text-text-primary">{t('changeBranch')}</span>
            <svg className="h-5 w-5 text-text-muted rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <button onClick={() => router.push('/settings/change-image')} className="flex w-full items-center gap-4 rounded-xl bg-surface px-5 py-4 text-start transition-colors hover:bg-surface/80 border border-border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg text-text-muted">
              <SettingsIcon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </div>
            <span className="flex-1 font-medium text-text-primary">{t('changeMerchantBackground')}</span>
            <svg className="h-5 w-5 text-text-muted rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="py-2">
            <LanguageToggle />
          </div>

          <div className="pt-2">
            <button onClick={() => { logout(); router.replace('/login'); }} className="flex w-full items-center gap-4 rounded-xl bg-surface px-5 py-4 text-start transition-colors hover:bg-error/5 border border-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error">
                <SettingsIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </div>
              <span className="flex-1 font-medium text-error">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
