'use client';

import { useEffect, useState, useRef } from 'react';
import { ensureAuth, getDb } from '@/lib/firebase';
import { ref, onValue, get } from 'firebase/database';
import type { Order } from '@/types/order';

/**
 * Firebase listener that watches specific order paths.
 * Instead of watching entire branches (too much data),
 * watches individual device paths with onValue on the latest child only.
 */
export function useFirebaseBranch(
  merchantId: string | null,
  branchId: string | null,
  selectedDevice?: { posName: string; deviceId: string } | 'all' | null,
) {
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [source, setSource] = useState('');
  const [listenerCount, setListenerCount] = useState(0);
  const baselineTimestampRef = useRef<number>(Math.floor(Date.now() / 1000));
  const readyRef = useRef(false);

  // Call after processing an order to prevent it from re-appearing
  const dismiss = () => {
    baselineTimestampRef.current = Math.floor(Date.now() / 1000);
    setLatestOrder(null);
  };

  useEffect(() => {
    if (!merchantId || !branchId) return;

    let cancelled = false;
    const unsubs: (() => void)[] = [];
    let active = 0;

    const getBranchFromLink = (link?: string): string | null => {
      if (!link) return null;
      try {
        const match = link.match(/data=(.+)/);
        if (!match) return null;
        const decoded = JSON.parse(atob(match[1]));
        return String(decoded.branchId || '');
      } catch { return null; }
    };

    // Poll-watch: check a path every 3 seconds for new data
    // This is more reliable than onValue on huge paths
    const pollWatch = (path: string, label: string) => {
      let lastCount = -1;
      let lastKey = '';

      const check = async () => {
        if (cancelled) return;
        try {
          const db = getDb();
          const snap = await get(ref(db, path));
          if (!snap.exists()) return;

          const data = snap.val();

          // If data has timestamp directly, it's a single order
          if (data.timestamp) {
            const order: Order = { ...data, idOrder: path.split('/').pop()! };
            if (data.timestamp > baselineTimestampRef.current && readyRef.current) {
              const ob = getBranchFromLink(order.link);
              if (ob && ob !== String(branchId)) return;
              console.log(`🔔 [Firebase] ${label}: NEW! total: ${order.total || '-'}`);
              setLatestOrder(order);
              setSource(label);
              setOrderCount((c) => c + 1);
            }
            return;
          }

          // It's a collection of orders
          const keys = Object.keys(data);
          const count = keys.length;

          if (lastCount === -1) {
            // First check — just record baseline
            lastCount = count;
            lastKey = keys[keys.length - 1] || '';
            console.log(`🔥 [Firebase] ${label}: connected, ${count} items`);
            setIsListening(true);
            active++;
            setListenerCount(active);
            return;
          }

          if (count > lastCount || keys[keys.length - 1] !== lastKey) {
            lastCount = count;
            lastKey = keys[keys.length - 1] || '';

            if (!readyRef.current) return;

            // Find newest order
            let latest: Order | null = null;
            for (const [k, v] of Object.entries(data) as [string, Order][]) {
              if (!latest || (v.timestamp || 0) > (latest.timestamp || 0)) {
                latest = { ...v, idOrder: k };
              }
            }

            if (latest) {
              const ob = getBranchFromLink(latest.link);
              if (ob && ob !== String(branchId)) return;

              if ((latest.timestamp || 0) > baselineTimestampRef.current) {
                console.log(`🔔 [Firebase] ${label}: NEW! total: ${latest.total || '-'}`);
                setLatestOrder(latest);
                setSource(label);
                setOrderCount((c) => c + 1);
              }
            }
          }
        } catch {}
      };

      // Initial check
      check();

      // Poll every 1 second
      const interval = setInterval(check, 1000);
      unsubs.push(() => clearInterval(interval));
    };

    // Real-time watch for a SINGLE order path (lightweight)
    const watchOrder = (path: string, label: string) => {
      const db = getDb();
      const orderRef = ref(db, path);
      let isFirst = true;

      const unsub = onValue(orderRef, (snap) => {
        if (cancelled) return;
        setIsListening(true);

        if (!snap.exists()) {
          if (isFirst) { isFirst = false; active++; setListenerCount(active); }
          return;
        }

        const data = snap.val() as Order;
        if (isFirst) {
          isFirst = false;
          active++;
          setListenerCount(active);
          console.log(`🔥 [Firebase] ${label}: connected`);
          return;
        }

        if (!readyRef.current) return;

        const ob = getBranchFromLink(data.link);
        if (ob && ob !== String(branchId)) return;

        console.log(`🔔 [Firebase] ${label}: UPDATED! total: ${data.total || '-'}`);
        setLatestOrder({ ...data, idOrder: snap.key || '' });
        setSource(label);
      }, () => {});

      unsubs.push(unsub);
    };

    const setup = async () => {
      const t0 = Date.now();
      await ensureAuth();
      if (cancelled) return;

      console.log(`🔥 [Firebase] Merchant ${merchantId}, branch ${branchId}, device:`, selectedDevice === 'all' ? 'ALL' : selectedDevice?.posName || 'none');

      // 1. Bonat path — poll (too many orders for onValue)
      pollWatch(`Bonat/${merchantId}/${branchId}`, 'Bonat');

      // 2. POS paths
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

      if (cancelled) return;
      console.log(`🔥 [Firebase] ${posBase}/: ${posNames.length} POS systems`);

      // 3. Check each POS for this merchant
      if (selectedDevice && selectedDevice !== 'all') {
        const { posName, deviceId } = selectedDevice;
        const path = deviceId === '_flat'
          ? `${posBase}/${posName}/${merchantId}`
          : `${posBase}/${posName}/${merchantId}/${deviceId}`;
        pollWatch(path, `${posName}/${deviceId === '_flat' ? 'all' : deviceId.slice(0, 8)}`);
      } else {
        await Promise.all(posNames.map(async (posName) => {
          if (cancelled) return;
          const merchantPath = `${posBase}/${posName}/${merchantId}`;
          try {
            const snap = await get(ref(getDb(), merchantPath));
            if (!snap.exists()) return;

            const data = snap.val();
            const firstKey = Object.keys(data)[0];
            const first = data[firstKey];
            const isNested = first && typeof first === 'object' && !('timestamp' in first);

            if (isNested) {
              for (const deviceId of Object.keys(data)) {
                if (cancelled) return;
                pollWatch(`${merchantPath}/${deviceId}`, `${posName}/${deviceId.slice(0, 8)}`);
              }
            } else {
              pollWatch(merchantPath, posName);
            }
          } catch {}
        }));
      }

      if (cancelled) return;

      setTimeout(() => {
        readyRef.current = true;
        setIsLoading(false);
        console.log(`🔥 [Firebase] Ready in ${Date.now() - t0}ms — polling ${unsubs.length} paths every 1s`);
      }, 1500);

      setIsListening(true);
    };

    setup();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      setIsListening(false);
      readyRef.current = false;
      baselineTimestampRef.current = Math.floor(Date.now() / 1000);
    };
  }, [merchantId, branchId, selectedDevice === 'all' ? 'all' : selectedDevice?.deviceId]);

  return { latestOrder, orderCount, isLoading, isListening, source, listenerCount, dismiss };
}
