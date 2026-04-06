'use client';

import { useEffect, useState } from 'react';
import { subscribeToOrderUpdates } from '@/lib/firebase';
import type { Order } from '@/types/order';

export function useFirebaseOrders(
  merchantId: string | null,
  branchId: string | null,
  orderId: string | null,
) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!merchantId || !branchId || !orderId) return;

    console.log(`🔥 [Firebase] Subscribed to order — path: Bonat/${merchantId}/${branchId}/${orderId}`);
    setIsListening(true);
    const unsubscribe = subscribeToOrderUpdates(
      merchantId,
      branchId,
      orderId,
      (orderData) => {
        console.log('🔥 [Firebase] Order data received:', orderData);
        setOrder(orderData);
      },
    );

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [merchantId, branchId, orderId]);

  return { order, isListening };
}
