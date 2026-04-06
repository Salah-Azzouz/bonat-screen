'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getMerchantProfile } from '@/lib/api/merchant';
import { Spinner } from '@/components/ui/LoadingSpinner';

export default function SplashPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, selectedBranch, setMerchant } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    const redirect = async () => {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }

      if (!selectedBranch) {
        router.replace('/branches');
        return;
      }

      try {
        const merchant = await getMerchantProfile();
        setMerchant(merchant);
        router.replace(merchant.idSubscription === '2' ? '/casher' : '/dashboard');
      } catch {
        router.replace('/login');
      }
    };

    const timer = setTimeout(redirect, 800);
    return () => clearTimeout(timer);
  }, [isHydrated, isAuthenticated, selectedBranch, router, setMerchant]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-brand-dark">
      <img src="/images/logo.png" alt="Bonat" className="h-14 w-auto animate-fade-in" />
      <Spinner size={24} />
    </div>
  );
}
