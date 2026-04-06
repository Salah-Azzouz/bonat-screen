'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useFirebaseCasherOrders } from '@/hooks/useFirebaseCasherOrders';
import { useFirebaseBranch } from '@/hooks/useFirebaseBranch';
import { useToastContext } from '@/providers/ToastProvider';
import { MerchantHeader } from '@/components/MerchantHeader';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { EmptyState } from '@/components/EmptyState';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Spinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneKeypad } from '@/components/PhoneKeypad';
import { NumericKeypad } from '@/components/NumericKeypad';
import { postReceipt, createOrder, updateOrder } from '@/lib/api/orders';
import { getCouponByCouponId } from '@/lib/api/coupons';
import { generateDeepLink, generateOrderId } from '@/lib/qrcode';
import { playNotificationSound } from '@/lib/sound';
import { t } from '@/lib/i18n';
import type { Order } from '@/types/order';

export default function CasherPage() {
  const router = useRouter();
  const { merchant, selectedBranch, logout } = useAuthStore();
  const { showSuccess: toastSuccess, showError } = useToastContext();

  const posTitle = merchant?.posTitle ?? null;
  const branchId = selectedBranch?.posIdBranch ?? selectedBranch?.idBranch ?? null;
  const hasPOS = !!posTitle;

  const { currentOrder: posOrder, orderType, reset } = useFirebaseCasherOrders(posTitle, branchId);

  const { selectedDevice } = useAuthStore();

  const { latestOrder, orderCount, isLoading: listenersLoading, isListening, source, dismiss } = useFirebaseBranch(
    merchant?.idMerchant ?? null,
    selectedBranch?.idBranch ?? null,
    selectedDevice,
  );

  const [orderId, setOrderId] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTotal, setSuccessTotal] = useState<string | number>('');
  const [activeTab, setActiveTab] = useState<'scan' | 'coupon'>('scan');
  const processedOrdersRef = useRef<Set<string>>(new Set());
  const ownOrdersRef = useRef<Set<string>>(new Set());

  const generateNewOrder = useCallback(async () => {
    if (hasPOS || !merchant || !selectedBranch) return;
    const newOrderId = generateOrderId();
    setOrderId(newOrderId);
    ownOrdersRef.current.add(newOrderId); // Track our own orders
    setDeepLink(generateDeepLink(merchant.idMerchant, selectedBranch.idBranch, newOrderId));
    try {
      await createOrder(merchant.idMerchant, selectedBranch.idBranch, newOrderId);
      console.log('📡 [Casher] QR order created — orderId:', newOrderId);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('failedToPost'));
    }
  }, [hasPOS, merchant, selectedBranch, showError]);

  useEffect(() => { if (!hasPOS) generateNewOrder(); }, [hasPOS, generateNewOrder]);

  // React to new orders from Firebase
  useEffect(() => {
    if (!latestOrder) return;
    const orderKey = `${latestOrder.idOrder}-${latestOrder.timestamp}`;

    // Skip if already processed
    if (processedOrdersRef.current.has(orderKey)) return;

    // Skip orders we created ourselves (QR code orders with no total)
    if (latestOrder.idOrder && ownOrdersRef.current.has(latestOrder.idOrder)) {
      console.log('🔕 [Casher] Skipping own order:', latestOrder.idOrder?.slice(0, 12));
      processedOrdersRef.current.add(orderKey);
      return;
    }

    // Skip orders without a total (not from POS)
    if (!latestOrder.total) {
      console.log('🔕 [Casher] Skipping order without total:', latestOrder.idOrder?.slice(0, 12));
      processedOrdersRef.current.add(orderKey);
      return;
    }

    processedOrdersRef.current.add(orderKey);
    console.log('🔔 [Casher] New order! Showing keypad — total:', latestOrder.total);
    playNotificationSound();
    if (navigator.vibrate) navigator.vibrate(200);
    setPendingOrder(latestOrder);
  }, [latestOrder]);

  const handlePhoneSubmitFromKeypad = async (phoneValue: string) => {
    if (!merchant || !selectedBranch || !pendingOrder) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        idBranch: selectedBranch.idBranch,
        idOrder: pendingOrder.idOrder || orderId,
        status: '4',
      };
      if (phoneValue.trim()) params.phoneNumber = phoneValue.trim();
      if (pendingOrder.idCustomer) params.idCustomer = pendingOrder.idCustomer;
      if (pendingOrder.link) params.data = pendingOrder.link;
      if (pendingOrder.total) params.total = String(pendingOrder.total);
      if (pendingOrder.orderNumber) params.orderNumber = pendingOrder.orderNumber;

      await postReceipt(params);
      setSuccessTotal(pendingOrder.total || '');
      setShowSuccess(true);
      setPendingOrder(null);
      dismiss(); // Reset baseline so this order doesn't re-appear

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        if (!hasPOS) generateNewOrder();
      }, 3000);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('failedToPost'));
    } finally { setLoading(false); }
  };

  const handleSkip = () => {
    setPendingOrder(null);
    dismiss(); // Reset baseline so this order doesn't re-appear
    if (!hasPOS) generateNewOrder();
  };

  const handleCouponSubmit = async (couponId: string) => {
    setLoading(true);
    try {
      await getCouponByCouponId(couponId);
      router.push(`/coupon/${couponId}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : t('invalidCoupon'));
    } finally { setLoading(false); }
  };

  if (!merchant || !selectedBranch) return null;

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="flex items-center justify-between bg-brand-dark px-5 py-3">
        <MerchantHeader merchant={merchant} variant="dark" />

        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full ${isListening ? 'bg-success animate-pulse' : 'bg-white/30'}`} />
            <span className="text-xs text-white/60">
              {listenersLoading ? 'Connecting...' : isListening ? `Live${source ? ` · ${source}` : ''}` : 'Offline'}
            </span>
          </div>

          {/* Order count badge */}
          {orderCount > 0 && (
            <span className="hidden sm:block rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/60">
              {orderCount} orders
            </span>
          )}

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-surface shadow-xl border border-border animate-fade-in overflow-hidden">
                  <div className="p-2">
                    <LanguageToggle />
                  </div>
                  <div className="border-t border-border">
                    <button onClick={() => { setMenuOpen(false); router.push('/branches'); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-bg transition-colors">
                      <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {t('changeBranch')}
                    </button>
                    <button onClick={() => { setMenuOpen(false); router.push('/settings'); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-bg transition-colors">
                      <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                      {t('settings')}
                    </button>
                  </div>
                  <div className="border-t border-border">
                    <button onClick={() => { logout(); router.replace('/login'); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      {t('logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex flex-1 flex-col items-center justify-center p-4 pb-24 md:p-8 md:pb-24 overflow-auto">
        {activeTab === 'scan' ? (
          <>
            {showSuccess ? (
              <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
                    <svg className="h-12 w-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-success/10 animate-pulse-ring" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-text-primary">Points Added!</h2>
                  {successTotal && (
                    <p className="mt-2 text-4xl font-bold text-success">{successTotal} <span className="text-lg">SAR</span></p>
                  )}
                  <p className="mt-3 text-sm text-text-muted">Points have been credited successfully</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Spinner size={12} />
                  <span>Returning in a moment...</span>
                </div>
              </div>
            ) : listenersLoading ? (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <Spinner size={32} />
                <p className="text-sm font-medium text-text-primary">Setting up listeners...</p>
                <p className="text-xs text-text-muted">Connecting to POS systems</p>
              </div>
            ) : pendingOrder ? (
              <div className="w-full max-w-sm animate-fade-in">
                <div className="mb-6 rounded-2xl bg-surface p-5 shadow-sm border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                        <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">New Order</p>
                        <p className="text-xs text-text-muted">
                          {source && `${source} · `}{new Date((pendingOrder.timestamp || 0) * 1000).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {pendingOrder.total && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand-orange">{pendingOrder.total}</p>
                        <p className="text-xs text-text-muted">SAR</p>
                      </div>
                    )}
                  </div>
                </div>
                <PhoneKeypad
                  title={t('phoneNumber')}
                  onSubmit={handlePhoneSubmitFromKeypad}
                  onCancel={handleSkip}
                  loading={loading}
                />
              </div>
            ) : deepLink ? (
              <div className="flex flex-col items-center gap-8 animate-fade-in">
                {/* Logo */}
                <img src="/images/logo.png" alt="Bonat" className="h-8 w-auto opacity-60" />

                {/* QR Card */}
                <div className="relative">
                  <div className="rounded-3xl bg-surface p-8 shadow-lg border border-border">
                    <QRCodeDisplay data={deepLink} size={240} />
                  </div>
                  {/* Corner decorations */}
                  <div className="absolute -top-2 -left-2 h-6 w-6 rounded-tl-xl border-t-3 border-l-3 border-brand-orange" />
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-tr-xl border-t-3 border-r-3 border-brand-orange" />
                  <div className="absolute -bottom-2 -left-2 h-6 w-6 rounded-bl-xl border-b-3 border-l-3 border-brand-orange" />
                  <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-br-xl border-b-3 border-r-3 border-brand-orange" />
                </div>

                {/* Info */}
                <div className="text-center space-y-3">
                  <p className="text-lg font-bold text-text-primary">{t('scanToCount')}</p>
                  <p className="text-sm text-text-muted">Show this code to the customer to earn points</p>
                </div>

                {/* Refresh */}
                <button
                  onClick={generateNewOrder}
                  className="flex items-center gap-2 rounded-full bg-surface border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:border-brand-orange hover:text-brand-orange transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('generateNewQr')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 animate-fade-in">
                <img src="/images/logo.png" alt="Bonat" className="h-8 w-auto opacity-40" />
                <EmptyState
                  icon={<svg className="h-10 w-10 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  title={t('waitingForOrders')}
                  description={t('ordersFromPos')}
                />
              </div>
            )}
          </>
        ) : (
          /* COUPON TAB */
          <div className="w-full max-w-xs animate-fade-in">
            <NumericKeypad
              title={t('enterCouponNumber')}
              placeholder="000000"
              onSubmit={handleCouponSubmit}
              loading={loading}
              maxLength={10}
              submitLabel={t('apply')}
            />
          </div>
        )}
      </main>

      {/* Floating bottom tabs */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex rounded-2xl bg-brand-dark p-1.5 shadow-xl">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
              activeTab === 'scan'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            {t('qrCode')}
          </button>
          <button
            onClick={() => setActiveTab('coupon')}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
              activeTab === 'coupon'
                ? 'bg-brand-orange text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            {t('coupon')}
          </button>
        </div>
      </div>
    </div>
  );
}
