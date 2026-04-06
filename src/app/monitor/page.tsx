'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { getAllBranches } from '@/lib/api/branches';
import { useRouter } from 'next/navigation';
import { ensureAuth, getDb } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { createOrder } from '@/lib/api/orders';
import { generateDeepLink, generateOrderId, generateQRCodeDataURL } from '@/lib/qrcode';
import { Spinner } from '@/components/ui/LoadingSpinner';
import { playNotificationSound } from '@/lib/sound';
import type { Branch } from '@/types/branch';
import type { Order } from '@/types/order';

interface BranchMonitor {
  branch: Branch;
  orderId: string;
  deepLink: string;
  qrDataUrl: string;
  order: Order | null;
  listening: boolean;
  error: string | null;
}

export default function MonitorPage() {
  const router = useRouter();
  const { merchant, isAuthenticated } = useAuthStore();
  const [monitors, setMonitors] = useState<BranchMonitor[]>([]);
  const [ready, setReady] = useState(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  const { data: branches, isLoading, error } = useQuery({
    queryKey: ['branches'],
    queryFn: getAllBranches,
    retry: 2,
  });

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const liveCount = monitors.filter((m) => m.listening).length;
  const alertCount = monitors.filter((m) => m.order && (m.order.idCustomer || m.order.phoneNumber || m.order.idCoupon)).length;

  // Regenerate QR for a specific branch
  const regenerate = useCallback(async (branchId: string) => {
    if (!merchant) return;
    const branch = monitors.find((m) => m.branch.idBranch === branchId);
    if (!branch) return;

    const oid = generateOrderId();
    const link = generateDeepLink(merchant.idMerchant, branchId, oid);
    const qr = await generateQRCodeDataURL(link, 140);

    // Unsubscribe old listener for this branch
    // Create new order + subscribe
    try { await createOrder(merchant.idMerchant, branchId, oid); } catch {}

    const db = getDb();
    const orderRef = ref(db, `Bonat/${merchant.idMerchant}/${branchId}/${oid}`);
    const unsub = onValue(orderRef, (snapshot) => {
      const data = snapshot.exists() ? (snapshot.val() as Order) : null;
      setMonitors((prev) => prev.map((m) =>
        m.branch.idBranch === branchId ? { ...m, orderId: oid, deepLink: link, qrDataUrl: qr, order: data, listening: true, error: null } : m,
      ));
      if (data && (data.idCustomer || data.phoneNumber || data.idCoupon)) {
        playNotificationSound();
      }
    }, (error) => {
      setMonitors((prev) => prev.map((m) =>
        m.branch.idBranch === branchId ? { ...m, error: error.message, listening: false } : m,
      ));
    });

    unsubsRef.current.push(unsub);
  }, [merchant, monitors]);

  // Setup all branch monitors
  useEffect(() => {
    if (!branches || !merchant || ready) return;

    const setup = async () => {
      console.log('🖥️ [Monitor] Starting setup —', branches.length, 'branches');
      await ensureAuth();
      console.log('🔥 [Monitor] Firebase auth ready');

      // 1. Build monitors with QR codes immediately
      const entries = branches.map((branch) => {
        const oid = generateOrderId();
        const link = generateDeepLink(merchant.idMerchant, branch.idBranch, oid);
        return { branch, oid, link };
      });

      const newMonitors: BranchMonitor[] = entries.map(({ branch, oid, link }) => ({
        branch, orderId: oid, deepLink: link, qrDataUrl: '',
        order: null, listening: false, error: null,
      }));

      setMonitors(newMonitors);
      setReady(true);

      // 2. Generate QR codes
      for (const { oid, link } of entries) {
        generateQRCodeDataURL(link, 140).then((qr) => {
          setMonitors((prev) => prev.map((m) => m.orderId === oid ? { ...m, qrDataUrl: qr } : m));
        });
      }

      // 3. Create orders sequentially, then subscribe
      const db = getDb();
      const unsubs: (() => void)[] = [];

      for (const { branch, oid } of entries) {
        console.log(`📡 [Monitor] Creating order — branch: ${branch.district}`);
        try {
          await createOrder(merchant.idMerchant, branch.idBranch, oid);
          console.log(`📡 [Monitor] Order created — branch: ${branch.district}, orderId: ${oid}`);
        } catch (err) {
          console.warn(`⚠️ [Monitor] Order creation failed — branch: ${branch.district}, subscribing anyway`);
        }

        const path = `Bonat/${merchant.idMerchant}/${branch.idBranch}/${oid}`;
        console.log(`🔥 [Monitor] Subscribing to path: ${path}`);
        const orderRef = ref(db, path);
        const unsub = onValue(orderRef, (snapshot) => {
          console.log(`🔥 [Monitor] Data received — branch: ${branch.district}, exists: ${snapshot.exists()}`);
          const data = snapshot.exists() ? (snapshot.val() as Order) : null;
          setMonitors((prev) => prev.map((m) =>
            m.orderId === oid ? { ...m, order: data, listening: true, error: null } : m,
          ));
          if (data && (data.idCustomer || data.phoneNumber || data.idCoupon)) {
            playNotificationSound();
          }
        }, (error) => {
          console.error(`❌ [Monitor] Listener failed — branch: ${branch.district}`, error.message);
          setMonitors((prev) => prev.map((m) =>
            m.orderId === oid ? { ...m, error: error.message, listening: false } : m,
          ));
        });

        unsubs.push(unsub);
      }

      unsubsRef.current = unsubs;
    };

    setup();
    return () => { unsubsRef.current.forEach((u) => u()); };
  }, [branches, merchant, ready]);

  if (!merchant) return null;

  return (
    <div className="h-screen flex flex-col bg-brand-dark overflow-hidden">
      {/* Compact header */}
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
            <span className="flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success">
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-white/50">
            <span className={`h-2 w-2 rounded-full ${liveCount === monitors.length && liveCount > 0 ? 'bg-success animate-pulse' : 'bg-brand-orange'}`} />
            {liveCount}/{monitors.length} live
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-3">
        {error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-error mb-3">Failed to load branches. Please log in again.</p>
              <button onClick={() => router.push('/login')} className="text-sm text-brand-orange hover:underline">Go to Login</button>
            </div>
          </div>
        ) : isLoading || !ready ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Spinner size={28} />
              <p className="mt-3 text-sm text-white">Connecting to all branches...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {monitors.map((m) => {
              const hasCustomer = m.order && (m.order.idCustomer || m.order.phoneNumber || m.order.idCoupon);

              return (
                <div
                  key={m.branch.idBranch}
                  className={`rounded-xl p-3 transition-all ${
                    hasCustomer
                      ? 'bg-success/20 ring-2 ring-success'
                      : m.error
                        ? 'bg-error/10 ring-1 ring-error/30'
                        : 'bg-white/5 hover:bg-white/8'
                  }`}
                >
                  {/* Top row: name + status */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xs font-bold text-white leading-tight truncate flex-1 mr-1">
                      {m.branch.district}
                    </h3>
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        hasCustomer ? 'bg-success' : m.listening ? 'bg-success animate-pulse' : m.error ? 'bg-error' : 'bg-white/20'
                      }`}
                    />
                  </div>

                  {/* QR */}
                  <div className="flex justify-center my-2">
                    {m.qrDataUrl ? (
                      <img src={m.qrDataUrl} alt="QR" className="rounded-lg" width={120} height={120} />
                    ) : (
                      <div className="h-[120px] w-[120px] flex items-center justify-center">
                        <Spinner size={16} />
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  {hasCustomer ? (
                    <div className="rounded-lg bg-success/20 px-2 py-1.5 text-center animate-fade-in">
                      <p className="text-[10px] font-bold text-success uppercase tracking-wide">Customer Scanned</p>
                      {m.order?.phoneNumber && (
                        <p className="text-[10px] text-white/60 mt-0.5">{m.order.phoneNumber}</p>
                      )}
                    </div>
                  ) : m.error ? (
                    <button
                      onClick={() => regenerate(m.branch.idBranch)}
                      className="w-full rounded-lg bg-error/20 px-2 py-1.5 text-center text-[10px] text-error hover:bg-error/30 transition-colors"
                    >
                      Retry
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${m.listening ? 'bg-success animate-pulse' : 'bg-white/30'}`} />
                      <p className="text-[10px] text-white">
                        {m.listening ? 'Waiting for scan' : 'Connecting...'}
                      </p>
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
