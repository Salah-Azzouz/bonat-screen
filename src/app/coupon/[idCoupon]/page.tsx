'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/LoadingSpinner';
import { getCouponByCouponId, markCouponUsed } from '@/lib/api/coupons';
import { useToastContext } from '@/providers/ToastProvider';
import { t } from '@/lib/i18n';

export default function CouponDetailsPage() {
  const router = useRouter();
  const { idCoupon } = useParams<{ idCoupon: string }>();
  const { showSuccess, showError } = useToastContext();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [marking, setMarking] = useState(false);

  const { data: coupon, isLoading } = useQuery({
    queryKey: ['coupon', idCoupon],
    queryFn: () => getCouponByCouponId(idCoupon),
    enabled: !!idCoupon,
  });

  useEffect(() => {
    if (!showConfirm) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowConfirm(false); };
    document.addEventListener('keydown', handleEscape);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showConfirm]);

  const handleConfirmUse = async () => {
    setShowConfirm(false);
    setMarking(true);
    try { await markCouponUsed(idCoupon); showSuccess(t('couponUsed')); router.back(); }
    catch (err) { showError(err instanceof Error ? err.message : t('failedToPost')); }
    finally { setMarking(false); }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-bg"><Spinner size={32} /></div>;
  if (!coupon) return <div className="flex h-screen flex-col bg-bg"><Header title={t('couponDetails')} /><div className="flex flex-1 items-center justify-center"><p className="text-text-muted">{t('couponNotFound')}</p></div></div>;

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Header title={t('couponDetails')} />
      <div className="flex flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto w-full max-w-lg animate-fade-in">
          {coupon.imageUrl && coupon.imageUrl.length > 0 && (
            <div className="mb-6 flex gap-3 overflow-x-auto">
              {coupon.imageUrl.map((url, i) => <img key={i} src={url} alt={`Coupon ${i + 1}`} className="h-44 w-44 shrink-0 rounded-xl object-cover" />)}
            </div>
          )}
          <div className="rounded-2xl bg-surface p-6 shadow-sm space-y-4">
            <div><span className="text-xs font-medium text-text-muted">{t('couponId')}</span><p className="font-bold text-text-primary">{coupon.idCoupon}</p></div>
            <div><span className="text-xs font-medium text-text-muted">{t('couponName')}</span><p className="font-bold text-text-primary">{coupon.name}</p></div>
            {coupon.title && <div><span className="text-xs font-medium text-text-muted">{t('title')}</span><p className="text-text-primary">{coupon.title}</p></div>}
            {coupon.description && <div><span className="text-xs font-medium text-text-muted">{t('description')}</span><p className="text-text-secondary text-sm">{coupon.description}</p></div>}
            <div className="flex items-end gap-4 pt-2">
              {coupon.oldPrice > 0 && <div><span className="text-xs font-medium text-text-muted">{t('oldPrice')}</span><p className="text-lg text-text-muted line-through">{coupon.oldPrice} SAR</p></div>}
              <div><span className="text-xs font-medium text-text-muted">{t('newPrice')}</span><p className="text-2xl font-bold text-success">{coupon.newPrice} SAR</p></div>
            </div>
          </div>
          <div className="mt-6"><Button onClick={() => setShowConfirm(true)} loading={marking} className="w-full" size="lg">{t('acceptCoupon')}</Button></div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirm-coupon-title" tabIndex={-1} className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-2xl animate-slide-up outline-none mx-4">
            <h3 id="confirm-coupon-title" className="mb-2 text-lg font-bold text-text-primary">{t('useCoupon')}?</h3>
            <p className="mb-6 text-sm text-text-secondary">{t('useCouponConfirm')}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">{t('cancel')}</Button>
              <Button onClick={handleConfirmUse} className="flex-1">{t('confirm')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
