'use client';

import { useEffect, useState, useCallback } from 'react';
import { subscribeToCasherOrders } from '@/lib/firebase';
import type { Order } from '@/types/order';

export function useFirebaseCasherOrders(
  posTitle: string | null,
  branchId: string | null,
) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderType, setOrderType] = useState<'new' | 'update' | null>(null);

  const reset = useCallback(() => {
    setCurrentOrder(null);
    setOrderType(null);
  }, []);

  useEffect(() => {
    if (!posTitle || !branchId) {
      console.log('🔥 [Firebase] Casher skipped — missing params, posTitle:', posTitle, 'branchId:', branchId);
      return;
    }

    console.log(`🔥 [Firebase] Casher subscribed — path: POS/${posTitle}/${branchId}`);
    const unsubscribe = subscribeToCasherOrders(
      posTitle,
      branchId,
      (order, type) => {
        setCurrentOrder(order);
        setOrderType(type);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [posTitle, branchId]);

  return { currentOrder, orderType, reset };
}
