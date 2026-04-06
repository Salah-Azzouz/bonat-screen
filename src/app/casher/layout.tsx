'use client';

import { useEffect, type ReactNode } from 'react';

export default function CasherLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
      } catch {}
    }
    requestWakeLock();
    const handleVisibility = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { wakeLock?.release(); document.removeEventListener('visibilitychange', handleVisibility); };
  }, []);

  return <>{children}</>;
}
