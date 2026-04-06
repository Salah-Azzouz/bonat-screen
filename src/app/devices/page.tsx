'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type PosDevice } from '@/stores/auth-store';
import { ensureAuth, getDb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Spinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { t } from '@/lib/i18n';

interface DiscoveredDevice {
  posName: string;
  deviceId: string;
  orderCount: number;
  branchId: string | null;
  branchName: string | null;
}

function getBranchFromLink(link?: string): { branchId: string; branchName?: string } | null {
  if (!link) return null;
  try {
    const match = link.match(/data=(.+)/);
    if (!match) return null;
    const decoded = JSON.parse(atob(match[1]));
    return { branchId: String(decoded.branchId || ''), branchName: decoded.branchName };
  } catch { return null; }
}

export default function DevicesPage() {
  const router = useRouter();
  const { merchant, selectedBranch, setDevice } = useAuthStore();
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | 'all'>('all');

  useEffect(() => {
    if (!merchant) { router.replace('/login'); return; }
    if (!selectedBranch) { router.replace('/branches'); return; }

    const discover = async () => {
      await ensureAuth();

      const isProd = process.env.NEXT_PUBLIC_API_BASE_URL?.includes('api.bonat.io') && !process.env.NEXT_PUBLIC_API_BASE_URL?.includes('stg');
      const posBase = isProd ? 'POS' : 'POS/dev';

      let posNames: string[] = [];
      try {
        const auth = (await import('firebase/auth')).getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const res = await fetch(`https://bonatdev.firebaseio.com/${posBase}.json?shallow=true&auth=${token}`);
          const data = await res.json();
          if (data) posNames = Object.keys(data);
        }
      } catch {}

      const found: DiscoveredDevice[] = [];
      const db = getDb();

      await Promise.all(posNames.map(async (posName) => {
        try {
          const snap = await get(ref(db, `${posBase}/${posName}/${merchant.idMerchant}`));
          if (!snap.exists()) return;

          const data = snap.val();
          const keys = Object.keys(data);
          const first = data[keys[0]];
          const isNested = first && typeof first === 'object' && !('timestamp' in first);

          if (isNested) {
            for (const deviceId of keys) {
              const deviceOrders = data[deviceId] || {};
              const orderKeys = Object.keys(deviceOrders);

              // Check the latest order to find which branch this device serves
              let branchId: string | null = null;
              let branchName: string | null = null;

              if (orderKeys.length > 0) {
                const lastOrder = deviceOrders[orderKeys[orderKeys.length - 1]];
                const info = getBranchFromLink(lastOrder?.link);
                if (info) {
                  branchId = info.branchId;
                  branchName = info.branchName || null;
                }
              }

              found.push({ posName, deviceId, orderCount: orderKeys.length, branchId, branchName });
            }
          } else {
            // Flat — check latest order for branch
            let branchId: string | null = null;
            let branchName: string | null = null;
            const lastOrder = data[keys[keys.length - 1]];
            const info = getBranchFromLink(lastOrder?.link);
            if (info) {
              branchId = info.branchId;
              branchName = info.branchName || null;
            }
            found.push({ posName, deviceId: '_flat', orderCount: keys.length, branchId, branchName });
          }
        } catch {}
      }));

      setDevices(found);
      setLoading(false);
    };

    discover();
  }, [merchant, selectedBranch, router]);

  // Filter devices for the selected branch
  const branchDevices = devices.filter((d) =>
    d.branchId === null || d.branchId === String(selectedBranch?.idBranch)
  );
  const otherDevices = devices.filter((d) =>
    d.branchId !== null && d.branchId !== String(selectedBranch?.idBranch)
  );

  const handleContinue = () => {
    if (selected === 'all') {
      setDevice('all');
    } else {
      const dev = devices.find((d) => `${d.posName}/${d.deviceId}` === selected);
      if (dev) setDevice({ posName: dev.posName, deviceId: dev.deviceId });
    }
    router.replace(merchant?.idSubscription === '2' ? '/casher' : '/dashboard');
  };

  if (!merchant || !selectedBranch) return null;

  return (
    <div className="flex h-screen flex-col md:flex-row bg-brand-dark">
      {/* Left panel */}
      <div className="flex w-full md:w-[420px] shrink-0 flex-col p-6 md:p-8">
        <div className="flex items-center justify-between mb-10">
          <img src="/images/logo.png" alt="Bonat" className="h-8 w-auto" />
          <LanguageToggle variant="dark" />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Select Device</h1>
          <p className="mt-2 text-sm text-white/50">
            Choose a POS device to listen to, or select all.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs text-white/40">Branch</span>
          <p className="font-bold text-white">{selectedBranch.district}</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-white/40 text-sm">
            <Spinner size={16} />
            <span>Discovering devices...</span>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-xs text-white/40">Found</span>
            <p className="font-bold text-white">{branchDevices.length} device(s) for this branch</p>
            {otherDevices.length > 0 && (
              <p className="text-xs text-white/30 mt-1">{otherDevices.length} device(s) on other branches</p>
            )}
          </div>
        )}

        <div className="mt-auto">
          <Button onClick={handleContinue} className="w-full" size="lg">
            {t('continue')}
          </Button>
          <button onClick={() => router.back()} className="mt-3 w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors">
            {t('back')}
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col rounded-t-3xl md:rounded-t-none md:rounded-s-3xl bg-bg overflow-hidden">
        <div className="px-8 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">POS Devices</h2>
          <p className="text-sm text-text-muted">
            {loading ? 'Discovering...' : `${branchDevices.length} device(s) for ${selectedBranch.district}`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>
          ) : (
            <div className="space-y-2">
              {/* All devices */}
              <button
                onClick={() => setSelected('all')}
                className={`flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-start transition-all ${
                  selected === 'all' ? 'border-brand-orange bg-brand-orange/5' : 'border-transparent bg-surface hover:border-border'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected === 'all' ? 'bg-brand-orange text-white' : 'bg-bg text-text-muted'}`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-primary">All Devices</p>
                  <p className="text-sm text-text-muted">Listen to all POS devices on this branch</p>
                </div>
                {selected === 'all' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>

              {/* Devices for this branch */}
              {branchDevices.map((dev) => {
                const key = `${dev.posName}/${dev.deviceId}`;
                const isSelected = selected === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-start transition-all ${
                      isSelected ? 'border-brand-orange bg-brand-orange/5' : 'border-transparent bg-surface hover:border-border'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-brand-orange text-white' : 'bg-bg text-text-muted'}`}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary">{dev.posName}</p>
                      <p className="text-sm text-text-muted truncate">
                        {dev.deviceId === '_flat' ? 'Direct integration' : dev.deviceId.slice(0, 12) + '...'}
                        {' · '}{dev.orderCount} orders
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Other branches (collapsed) */}
              {otherDevices.length > 0 && (
                <div className="pt-4">
                  <p className="text-xs font-medium text-text-muted mb-2 px-1">Other branches</p>
                  {otherDevices.map((dev) => {
                    const key = `${dev.posName}/${dev.deviceId}`;
                    const isSelected = selected === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(key)}
                        className={`flex w-full items-center gap-4 rounded-xl border-2 px-4 py-3 text-start transition-all mb-1 ${
                          isSelected ? 'border-brand-orange bg-brand-orange/5' : 'border-transparent bg-surface/50 hover:border-border'
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-brand-orange text-white' : 'bg-bg text-text-muted'}`}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-secondary">{dev.posName}</p>
                          <p className="text-xs text-text-muted truncate">
                            {dev.branchName || `Branch ${dev.branchId}`} · {dev.orderCount} orders
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {branchDevices.length === 0 && otherDevices.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-text-muted">No POS devices found for this merchant</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
