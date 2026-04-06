import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  onChildAdded,
  onChildChanged,
  query,
  orderByChild,
  limitToLast,
  type Unsubscribe,
} from 'firebase/database';
import type { Order } from '@/types/order';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: 'bonatdev.appspot.com',
};

function getApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

let authPromise: Promise<void> | null = null;

export function ensureAuth(): Promise<void> {
  if (!authPromise) {
    authPromise = (async () => {
      try {
        const auth = getAuth(getApp());
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        console.log('🔥 [Firebase] Auth ready — uid:', auth.currentUser?.uid);
      } catch (err) {
        console.error('❌ [Firebase] Anonymous auth failed:', err);
      }
    })();
  }
  return authPromise;
}

export function getDb() {
  return getDatabase(getApp());
}

/** Subscribe to order updates for regular merchants: Bonat/{merchantId}/{branchId}/{orderId} */
export function subscribeToOrderUpdates(
  merchantId: string,
  branchId: string,
  orderId: string,
  callback: (order: Order | null) => void,
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  ensureAuth().then(() => {
    if (cancelled) return;
    const db = getDb();
    const orderRef = ref(db, `Bonat/${merchantId}/${branchId}/${orderId}`);
    unsub = onValue(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.val() as Order);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`❌ [Firebase] Listener error — path: Bonat/${merchantId}/${branchId}/${orderId}`, error.message);
      },
    );
  });

  return () => {
    cancelled = true;
    unsub?.();
  };
}

/** Subscribe to casher orders: POS/{posTitle}/{branchId} ordered by timestamp, last 1 */
export function subscribeToCasherOrders(
  posTitle: string,
  branchId: string,
  callback: (order: Order, type: 'new' | 'update') => void,
): () => void {
  let unsubAdded: (() => void) | null = null;
  let unsubChanged: (() => void) | null = null;
  let cancelled = false;

  ensureAuth().then(() => {
    if (cancelled) return;
    const db = getDb();
    const ordersRef = ref(db, `POS/${posTitle}/${branchId}`);
    const ordersQuery = query(ordersRef, orderByChild('timestamp'), limitToLast(1));

    unsubAdded = onChildAdded(ordersQuery, (snapshot) => {
      const order = snapshot.val() as Order;
      if (!order.idCustomer) {
        callback({ ...order, idOrder: snapshot.key! }, 'new');
      }
    });

    unsubChanged = onChildChanged(ordersQuery, (snapshot) => {
      const order = snapshot.val() as Order;
      callback({ ...order, idOrder: snapshot.key! }, 'update');
    });
  });

  return () => {
    cancelled = true;
    unsubAdded?.();
    unsubChanged?.();
  };
}
