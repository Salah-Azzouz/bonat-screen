'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useToastContext } from '@/providers/ToastProvider';
import { MerchantHeader } from '@/components/MerchantHeader';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { FlipDevicePrompt } from '@/components/FlipDevicePrompt';
import { PhoneInput } from '@/components/PhoneInput';
import { CouponInput } from '@/components/CouponInput';
import { generateDeepLink, generateOrderId } from '@/lib/qrcode';
import { createOrder, updateOrder } from '@/lib/api/orders';
import { getCouponByCouponId } from '@/lib/api/coupons';
import { playNotificationSound } from '@/lib/sound';
import { LanguageToggle } from '@/components/LanguageToggle';
import { t } from '@/lib/i18n';
import { useSidebar } from '@/hooks/useSidebar';

type ViewMode = 'qr' | 'coupon';

export default function DashboardPage() {
  const router = useRouter();
  const { merchant, selectedBranch, logout } = useAuthStore();
  const { showError } = useToastContext();

  const [viewMode, setViewMode] = useState<ViewMode>('qr');
  const [orderId, setOrderId] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [showFlip, setShowFlip] = useState(false);
  const [loading, setLoading] = useState(false);
  const sidebar = useSidebar();

  const { order, isListening } = useFirebaseOrders(merchant?.idMerchant ?? null, selectedBranch?.idBranch ?? null, orderId || null);

  const generateNewOrder = useCallback(async () => {
    if (!merchant || !selectedBranch) return;
    const newOrderId = generateOrderId();
    setOrderId(newOrderId);
    const link = generateDeepLink(merchant.idMerchant, selectedBranch.idBranch, newOrderId);
    setDeepLink(link);
    try {
      const result = await createOrder(merchant.idMerchant, selectedBranch.idBranch, newOrderId);
      console.log('📡 [Dashboard] Order created via API — orderId:', newOrderId);
    } catch (err) { showError(err instanceof Error ? err.message : t('failedToPost')); }
  }, [merchant, selectedBranch, showError]);

  useEffect(() => { generateNewOrder(); }, [generateNewOrder]);

  useEffect(() => {
    if (!order) return;
    console.log('🖥️ [Dashboard] Order state changed:', JSON.stringify(order));

    if (order.idCustomer || order.phoneNumber || order.idCoupon) {
      setShowFlip(true);
      playNotificationSound();
      if (navigator.vibrate) navigator.vibrate(200);
      return;
    }

    // Status changed from initial "new"
    if (order.status && order.status !== 'new') {
      setShowFlip(true);
      playNotificationSound();
      if (navigator.vibrate) navigator.vibrate(200);
    }
  }, [order]);

  const handleFlipConfirm = () => {
    setShowFlip(false);
    if (!order || !selectedBranch) return;
    if (order.idCoupon) { router.push(`/coupon/${order.idCoupon}`); return; }
    const params = new URLSearchParams({ idOrder: orderId, idBranch: selectedBranch.idBranch });
    if (order.idCustomer) params.set('idCustomer', order.idCustomer);
    if (order.phoneNumber) params.set('phoneNumber', order.phoneNumber);
    router.push(`/dashboard/add-total?${params.toString()}`);
  };

  const handlePhoneSubmit = async (phone: string) => {
    if (!merchant || !selectedBranch) return;
    setLoading(true);
    try {
      await updateOrder(merchant.idMerchant, selectedBranch.idBranch, orderId, phone);
      const params = new URLSearchParams({ idOrder: orderId, idBranch: selectedBranch.idBranch, phoneNumber: phone });
      router.push(`/dashboard/add-total?${params.toString()}`);
    } catch (err) { showError(err instanceof Error ? err.message : t('failedToPost')); }
    finally { setLoading(false); }
  };

  const handleCouponSubmit = async (couponId: string) => {
    setLoading(true);
    try { await getCouponByCouponId(couponId); router.push(`/coupon/${couponId}`); }
    catch (err) { showError(err instanceof Error ? err.message : t('invalidCoupon')); }
    finally { setLoading(false); }
  };

  if (!merchant || !selectedBranch) return null;

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="flex md:hidden items-center justify-between bg-brand-dark px-4 py-3">
        <MerchantHeader merchant={merchant} variant="dark" />
        <button
          onClick={sidebar.toggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          {sidebar.isOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile backdrop */}
      {sidebar.isOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={sidebar.close} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebar.isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-30 h-[calc(100%-52px)] md:h-full top-[52px] md:top-0 w-[320px] md:w-[380px] flex flex-col bg-brand-dark text-white transition-transform duration-300 ease-in-out`}>
        {/* Desktop merchant header */}
        <div className="hidden md:block border-b border-white/10 p-6">
          <MerchantHeader merchant={merchant} variant="dark" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <div className="flex rounded-xl bg-white/10 p-1">
            <button onClick={() => setViewMode('qr')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${viewMode === 'qr' ? 'bg-brand-orange text-white' : 'text-white/60 hover:text-white'}`}>
              {t('qrCode')}
            </button>
            <button onClick={() => setViewMode('coupon')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${viewMode === 'coupon' ? 'bg-brand-orange text-white' : 'text-white/60 hover:text-white'}`}>
              {t('coupon')}
            </button>
          </div>

          <PhoneInput onSubmit={handlePhoneSubmit} loading={loading} dark />
          {viewMode === 'coupon' && <CouponInput onSubmit={handleCouponSubmit} loading={loading} dark />}
        </div>

        <div className="border-t border-white/10 p-3 md:p-4 space-y-1">
          <LanguageToggle variant="dark" />
          <button onClick={() => router.push('/settings')} className="flex h-10 w-full items-center gap-3 rounded-xl px-4 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t('settings')}
          </button>
          <button onClick={() => { logout(); router.replace('/login'); }} className="flex h-10 w-full items-center gap-3 rounded-xl px-4 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center bg-bg p-4 md:p-8">
        {viewMode === 'qr' ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            {deepLink && <QRCodeDisplay data={deepLink} size={350} />}
            <p className="text-sm text-text-muted">{t('scanToCount')}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full ${isListening ? 'bg-success animate-pulse' : 'bg-text-muted'}`} />
              <span className="text-text-muted">{isListening ? 'Firebase connected' : 'Connecting...'}</span>
            </div>
            <button onClick={generateNewOrder} className="text-sm font-medium text-brand-orange hover:underline">
              {t('generateNewQr')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-orange/10">
              <svg className="h-12 w-12 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-text-primary">{t('couponMode')}</p>
            <p className="text-sm text-text-muted">{t('couponModeDesc')}</p>
          </div>
        )}
      </main>

      <FlipDevicePrompt isVisible={showFlip} onConfirm={handleFlipConfirm} onCancel={() => setShowFlip(false)} />
    </div>
  );
}
