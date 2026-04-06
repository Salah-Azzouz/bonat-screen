'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useFirebaseCasherOrders } from '@/hooks/useFirebaseCasherOrders';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { useToastContext } from '@/providers/ToastProvider';
import { MerchantHeader } from '@/components/MerchantHeader';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { FlipDevicePrompt } from '@/components/FlipDevicePrompt';
import { PhoneInput } from '@/components/PhoneInput';
import { CouponInput } from '@/components/CouponInput';
import { EmptyState } from '@/components/EmptyState';
import { LanguageToggle } from '@/components/LanguageToggle';
import { postSquareOrder, createOrder, updateOrder } from '@/lib/api/orders';
import { getCouponByCouponId } from '@/lib/api/coupons';
import { generateDeepLink, generateOrderId } from '@/lib/qrcode';
import { playNotificationSound } from '@/lib/sound';
import { t } from '@/lib/i18n';
import { useSidebar } from '@/hooks/useSidebar';

export default function CasherPage() {
  const router = useRouter();
  const { merchant, selectedBranch, logout } = useAuthStore();
  const { showSuccess, showError } = useToastContext();

  const posTitle = merchant?.posTitle ?? null;
  const branchId = selectedBranch?.posIdBranch ?? selectedBranch?.idBranch ?? null;
  const hasPOS = !!posTitle;

  // POS mode: listen for incoming orders
  const { currentOrder: posOrder, orderType, reset } = useFirebaseCasherOrders(posTitle, branchId);

  // QR mode (fallback when no POS): generate QR and listen
  const [orderId, setOrderId] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const { order: qrOrder, isListening } = useFirebaseOrders(
    !hasPOS ? (merchant?.idMerchant ?? null) : null,
    !hasPOS ? (selectedBranch?.idBranch ?? null) : null,
    !hasPOS ? (orderId || null) : null,
  );

  const [showFlip, setShowFlip] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const sidebar = useSidebar();

  // QR mode: generate order on mount
  const generateNewOrder = useCallback(async () => {
    if (hasPOS || !merchant || !selectedBranch) return;
    const newOrderId = generateOrderId();
    setOrderId(newOrderId);
    const link = generateDeepLink(merchant.idMerchant, selectedBranch.idBranch, newOrderId);
    setDeepLink(link);
    try {
      await createOrder(merchant.idMerchant, selectedBranch.idBranch, newOrderId);
      console.log('📡 [Casher] QR order created via API — orderId:', newOrderId);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('failedToPost'));
    }
  }, [hasPOS, merchant, selectedBranch, showError]);

  useEffect(() => { if (!hasPOS) generateNewOrder(); }, [hasPOS, generateNewOrder]);

  // POS mode: react to incoming orders
  useEffect(() => {
    if (!posOrder) return;
    if (orderType === 'new' && posOrder.link) {
      setShowQR(true);
      playNotificationSound();
      if (navigator.vibrate) navigator.vibrate(200);
    }
    if (orderType === 'update') handleAutoPost();
  }, [posOrder, orderType]);

  // QR mode: react to any order change (customer scan or status change)
  useEffect(() => {
    if (hasPOS || !qrOrder) return;
    console.log('🖥️ [Casher] QR order state changed:', JSON.stringify(qrOrder));

    // Customer scanned — has customer data
    if (qrOrder.idCustomer || qrOrder.phoneNumber || qrOrder.idCoupon) {
      setShowFlip(true);
      playNotificationSound();
      if (navigator.vibrate) navigator.vibrate(200);
      return;
    }

    // Status changed from initial "new" to something else
    if (qrOrder.status && qrOrder.status !== 'new') {
      setShowFlip(true);
      playNotificationSound();
      if (navigator.vibrate) navigator.vibrate(200);
    }
  }, [hasPOS, qrOrder]);

  const handleAutoPost = async () => {
    if (!posOrder) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (posOrder.link) params.data = posOrder.link;
      if (posOrder.idCustomer) params.idCustomer = posOrder.idCustomer;
      if (posOrder.phoneNumber) params.phoneNumber = posOrder.phoneNumber;
      await postSquareOrder(params);
      showSuccess(t('receiptPosted'));
      reset(); setShowQR(false);
    } catch (err) { showError(err instanceof Error ? err.message : t('failedToPost')); }
    finally { setLoading(false); }
  };

  const handlePhoneSubmit = async (phone: string) => {
    if (!merchant || !selectedBranch) return;
    setLoading(true);
    try {
      if (hasPOS && posOrder) {
        const params: Record<string, string> = { phoneNumber: phone };
        if (posOrder.link) params.data = posOrder.link;
        await postSquareOrder(params);
        showSuccess(t('receiptPosted'));
        reset(); setShowQR(false);
      } else {
        await updateOrder(merchant.idMerchant, selectedBranch.idBranch, orderId, phone);
        const params = new URLSearchParams({ idOrder: orderId, idBranch: selectedBranch.idBranch, phoneNumber: phone });
        router.push(`/dashboard/add-total?${params.toString()}`);
      }
    } catch (err) { showError(err instanceof Error ? err.message : t('failedToPost')); }
    finally { setLoading(false); }
  };

  const handleCouponSubmit = async (couponId: string) => {
    setLoading(true);
    try { await getCouponByCouponId(couponId); router.push(`/coupon/${couponId}`); }
    catch (err) { showError(err instanceof Error ? err.message : t('invalidCoupon')); }
    finally { setLoading(false); }
  };

  const handleFlipConfirm = () => {
    setShowFlip(false);
    const order = hasPOS ? posOrder : qrOrder;
    if (!order || !selectedBranch) return;
    if (order.idCoupon) { router.push(`/coupon/${order.idCoupon}`); return; }
    const params = new URLSearchParams({ idOrder: orderId, idBranch: selectedBranch.idBranch });
    if (order.idCustomer) params.set('idCustomer', order.idCustomer);
    if (order.phoneNumber) params.set('phoneNumber', order.phoneNumber);
    router.push(`/dashboard/add-total?${params.toString()}`);
  };

  if (!merchant || !selectedBranch) return null;

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="flex md:hidden items-center justify-between bg-brand-dark px-4 py-3">
        <MerchantHeader merchant={merchant} variant="dark" />
        <button onClick={sidebar.toggle} className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors">
          {sidebar.isOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {sidebar.isOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={sidebar.close} />}

      <aside className={`${sidebar.isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-30 h-[calc(100%-52px)] md:h-full top-[52px] md:top-0 w-[320px] md:w-[380px] flex flex-col bg-brand-dark text-white transition-transform duration-300 ease-in-out`}>
        <div className="hidden md:block border-b border-white/10 p-6"><MerchantHeader merchant={merchant} variant="dark" /></div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <PhoneInput onSubmit={handlePhoneSubmit} loading={loading} dark />
          <CouponInput onSubmit={handleCouponSubmit} loading={loading} dark />
        </div>
        <div className="border-t border-white/10 p-3 md:p-4 space-y-1">
          <LanguageToggle variant="dark" />
          <button onClick={() => router.push('/branches?update=true')} className="flex h-10 w-full items-center gap-3 rounded-xl px-4 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t('changeBranch')}
          </button>
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

      <main className="flex flex-1 flex-col items-center justify-center bg-bg p-4 md:p-8">
        {/* POS mode: show incoming order QR */}
        {hasPOS && showQR && posOrder?.link ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <QRCodeDisplay data={posOrder.link} size={350} />
            <p className="text-sm text-text-muted">{t('orderReceivedWaiting')}</p>
          </div>
        ) : !hasPOS && deepLink ? (
          /* QR mode: show generated QR */
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <QRCodeDisplay data={deepLink} size={350} />
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
          <EmptyState
            icon={<svg className="h-10 w-10 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title={t('waitingForOrders')}
            description={t('ordersFromPos')}
          />
        )}
      </main>

      <FlipDevicePrompt isVisible={showFlip} onConfirm={handleFlipConfirm} onCancel={() => setShowFlip(false)} />
    </div>
  );
}
