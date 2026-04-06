'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { ensureAuth, getDb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { generateDeepLink, generateOrderId, generateQRCodeDataURL } from '@/lib/qrcode';
import { Spinner } from '@/components/ui/LoadingSpinner';
import { playNotificationSound } from '@/lib/sound';
import type { Branch } from '@/types/branch';
import type { Order } from '@/types/order';

interface BranchMonitor {
  branch: Branch;
  orderId: string;
  qrDataUrl: string;
  lastOrder: Order | null;
  orderCount: number;
  listening: boolean;
  error: string | null;
}

export default function MonitorPage() {
  const router = useRouter();
  const { merchant, token, isAuthenticated } = useAuthStore();
  const [monitors, setMonitors] = useState<BranchMonitor[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const unsubsRef = useRef<(() => void)[]>([]);

  const liveCount = monitors.filter((m) => m.listening).length;
  const alertCount = monitors.filter((m) => m.lastOrder && (m.lastOrder.idCustomer || m.lastOrder.phoneNumber || m.lastOrder.idCoupon)).length;

  useEffect(() => {
    if (!isAuthenticated || !merchant || !token) {
      router.replace('/login');
      return;
    }

    let cancelled = false;

    const setup = async () => {
      console.log('🖥️ [Monitor] Starting...');

      // 1. Fetch branches directly (bypass apiGet to avoid auto-logout)
      let branches: Branch[] = [];
      try {
        const res = await fetch(`/api/proxy?endpoint=/allbranch`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.code === 0 && Array.isArray(json.data)) {
          branches = json.data;
        } else {
          throw new Error(json.errors?.[0] || 'Failed to load branches');
        }
      } catch (err) {
        console.error('❌ [Monitor] Branch fetch failed:', err);
        if (!cancelled) { setStatus('error'); setErrorMsg(err instanceof Error ? err.message : 'Failed'); }
        return;
      }

      console.log(`📡 [Monitor] Loaded ${branches.length} branches`);

      // 2. Firebase auth
      await ensureAuth();
      console.log('🔥 [Monitor] Firebase auth ready');

      if (cancelled) return;

      // 3. Build monitors
      const newMonitors: BranchMonitor[] = branches.map((branch) => {
        const oid = generateOrderId();
        return {
          branch, orderId: oid, qrDataUrl: '',
          lastOrder: null, orderCount: 0, listening: false, error: null,
        };
      });

      setMonitors(newMonitors);
      setStatus('ready');

      // 4. Generate QR codes async
      for (const m of newMonitors) {
        const link = generateDeepLink(merchant.idMerchant, m.branch.idBranch, m.orderId);
        generateQRCodeDataURL(link, 140).then((qr) => {
          if (!cancelled) {
            setMonitors((prev) => prev.map((p) =>
              p.branch.idBranch === m.branch.idBranch ? { ...p, qrDataUrl: qr } : p,
            ));
          }
        });

        // Create order in Firebase (fire and forget)
        fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: '/cf/createOrder', body: new URLSearchParams({ idMerchant: merchant.idMerchant, idBranch: m.branch.idBranch, idOrder: m.orderId }).toString(), headers: {} }),
        }).catch(() => {});
      }

      // 5. Subscribe to each branch with onValue
      const db = getDb();
      const unsubs: (() => void)[] = [];

      for (const m of newMonitors) {
        const branchPath = `Bonat/${merchant.idMerchant}/${m.branch.idBranch}`;
        console.log(`🔥 [Monitor] Subscribing: ${branchPath}`);

        const branchRef = ref(db, branchPath);
        const unsub = onValue(branchRef, (snapshot) => {
          if (cancelled) return;

          if (!snapshot.exists()) {
            console.log(`🔥 [Monitor] ${m.branch.district}: empty`);
            setMonitors((prev) => prev.map((p) =>
              p.branch.idBranch === m.branch.idBranch ? { ...p, listening: true } : p,
            ));
            return;
          }

          const allOrders = snapshot.val() as Record<string, Order>;
          const entries = Object.entries(allOrders);

          // Find latest by timestamp
          let latest: Order | null = null;
          let latestKey = '';
          for (const [key, order] of entries) {
            if (!latest || (order.timestamp || 0) > (latest.timestamp || 0)) {
              latest = { ...order, idOrder: key };
              latestKey = key;
            }
          }

          console.log(`🔥 [Monitor] ${m.branch.district}: ${entries.length} orders, latest: ${latestKey.slice(0, 8)}`);

          setMonitors((prev) => prev.map((p) =>
            p.branch.idBranch === m.branch.idBranch
              ? { ...p, lastOrder: latest, orderCount: entries.length, listening: true, error: null }
              : p,
          ));

          if (latest && (latest.idCustomer || latest.phoneNumber || latest.idCoupon)) {
            playNotificationSound();
          }
        }, (error) => {
          console.error(`❌ [Monitor] ${m.branch.district}:`, error.message);
          if (!cancelled) {
            setMonitors((prev) => prev.map((p) =>
              p.branch.idBranch === m.branch.idBranch ? { ...p, error: error.message, listening: false } : p,
            ));
          }
        });

        unsubs.push(unsub);
      }

      unsubsRef.current = unsubs;
    };

    setup();

    return () => {
      cancelled = true;
      unsubsRef.current.forEach((u) => u());
    };
  }, [merchant, token, isAuthenticated, router]);

  if (!merchant) return null;

  return (
    <div className="h-screen flex flex-col bg-brand-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Bonat" className="h-6" />
          <div>
            <h1 className="text-sm font-bold text-white">Branch Monitor</h1>
            <p className="text-xs text-white/40">{merchant.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {alertCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success animate-pulse">
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-white/50">
            <span className={`h-2 w-2 rounded-full ${liveCount === monitors.length && liveCount > 0 ? 'bg-success animate-pulse' : 'bg-brand-orange'}`} />
            {liveCount}/{monitors.length} live
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {status === 'error' ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-error mb-3">{errorMsg || 'Failed to load'}</p>
              <button onClick={() => router.push('/login')} className="text-sm text-brand-orange hover:underline">Go to Login</button>
            </div>
          </div>
        ) : status === 'loading' ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Spinner size={28} />
              <p className="mt-3 text-sm text-white">Connecting to all branches...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {monitors.map((m) => {
              const hasCustomer = m.lastOrder && (m.lastOrder.idCustomer || m.lastOrder.phoneNumber || m.lastOrder.idCoupon);

              return (
                <div
                  key={m.branch.idBranch}
                  className={`rounded-xl p-3 transition-all ${
                    hasCustomer
                      ? 'bg-success/20 ring-2 ring-success'
                      : m.error
                        ? 'bg-error/10 ring-1 ring-error/30'
                        : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 mr-2">
                      <h3 className="text-xs font-bold text-white leading-tight truncate">{m.branch.district}</h3>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {m.orderCount > 0 ? `${m.orderCount} orders` : 'No orders yet'}
                        {m.lastOrder?.status ? ` · ${m.lastOrder.status}` : ''}
                      </p>
                    </div>
                    <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      hasCustomer ? 'bg-success' : m.listening ? 'bg-success animate-pulse' : m.error ? 'bg-error' : 'bg-white/20'
                    }`} />
                  </div>

                  <div className="flex justify-center my-2">
                    {m.qrDataUrl ? (
                      <img src={m.qrDataUrl} alt="QR" className="rounded-lg" width={120} height={120} />
                    ) : (
                      <div className="h-[120px] w-[120px] flex items-center justify-center"><Spinner size={16} /></div>
                    )}
                  </div>

                  {hasCustomer ? (
                    <div className="rounded-lg bg-success/20 px-2 py-1.5 text-center animate-fade-in">
                      <p className="text-[10px] font-bold text-success uppercase tracking-wide">Customer Scanned</p>
                      {m.lastOrder?.phoneNumber && <p className="text-[10px] text-white/60 mt-0.5">{m.lastOrder.phoneNumber}</p>}
                      {m.lastOrder?.idCustomer && <p className="text-[10px] text-white/60 mt-0.5">ID: {m.lastOrder.idCustomer}</p>}
                    </div>
                  ) : m.error ? (
                    <div className="rounded-lg bg-error/20 px-2 py-1.5 text-center">
                      <p className="text-[10px] text-error truncate">{m.error.slice(0, 50)}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${m.listening ? 'bg-success animate-pulse' : 'bg-white/30'}`} />
                      <p className="text-[10px] text-white">{m.listening ? 'Live — waiting for scan' : 'Connecting...'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
