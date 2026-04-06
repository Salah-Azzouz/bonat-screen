'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { BranchListItem } from '@/components/BranchListItem';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/ui/LoadingSpinner';
import { LanguageToggle } from '@/components/LanguageToggle';
import { getAllBranches } from '@/lib/api/branches';
import { useAuthStore } from '@/stores/auth-store';
import { useToastContext } from '@/providers/ToastProvider';
import { t } from '@/lib/i18n';
import type { Branch } from '@/types/branch';

export default function BranchesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpdate = searchParams.get('update') === 'true';
  const { merchant, deviceName: savedDeviceName, setBranch } = useAuthStore();
  const { showError } = useToastContext();

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deviceName, setDeviceName] = useState(savedDeviceName || '');

  const { data: branches, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['branches'],
    queryFn: getAllBranches,
  });

  const handleContinue = () => {
    if (!selectedBranch) { showError(t('selectBranchError')); return; }
    if (!deviceName.trim()) { showError(t('enterDeviceName')); return; }
    setBranch(selectedBranch, deviceName.trim());
    if (isUpdate) { router.back(); return; }
    router.replace(merchant?.idSubscription === '2' ? '/casher' : '/dashboard');
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-brand-dark">
      <div className="flex w-full md:w-[420px] shrink-0 flex-col p-6 md:p-8">
        <div className="flex items-center justify-between mb-10">
          <img src="/images/logo.png" alt="Bonat" className="h-8 w-auto" />
          <LanguageToggle variant="dark" />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{t('setupDevice')}</h1>
          <p className="mt-2 text-sm text-white/50">{t('setupDeviceDesc')}</p>
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-white/70">{t('deviceName')}</label>
          <input
            placeholder={t('deviceNamePlaceholder')}
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/30 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30 transition-all"
          />
        </div>

        {selectedBranch && (
          <div className="mb-6 rounded-xl border border-brand-orange/30 bg-brand-orange/10 p-4 animate-fade-in">
            <span className="text-xs font-medium text-brand-orange">{t('selectedBranch')}</span>
            <p className="mt-1 font-bold text-white">{selectedBranch.district}</p>
            <p className="text-sm text-white/70">{selectedBranch.workingHours}</p>
          </div>
        )}

        <div className="mt-auto">
          <Button onClick={handleContinue} className="w-full" size="lg">
            {t('continue')}
          </Button>
          {isUpdate && (
            <button onClick={() => router.back()} className="mt-3 w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors">
              {t('cancel')}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-t-3xl md:rounded-t-none md:rounded-s-3xl bg-bg overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary">{t('branches')}</h2>
            <p className="text-sm text-text-muted">{branches?.length || 0} {t('locationsAvailable')}</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
          >
            {isRefetching ? <Spinner size={14} /> : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isRefetching ? t('refreshing') : t('refresh')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
          ) : branches && branches.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
              {branches.map((branch) => (
                <BranchListItem key={branch.idBranch} branch={branch} isSelected={selectedBranch?.idBranch === branch.idBranch} onSelect={setSelectedBranch} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<svg className="h-8 w-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
              title={t('noBranches')}
              description={t('noBranchesDesc')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
