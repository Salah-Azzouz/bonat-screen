'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { postReceipt } from '@/lib/api/orders';
import { useToastContext } from '@/providers/ToastProvider';
import { t } from '@/lib/i18n';

export default function AddTotalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToastContext();

  const idOrder = searchParams.get('idOrder') || '';
  const idBranch = searchParams.get('idBranch') || '';
  const idCustomer = searchParams.get('idCustomer') || '';
  const phoneNumber = searchParams.get('phoneNumber') || '';

  useEffect(() => { if (!idOrder || !idBranch) router.replace('/dashboard'); }, [idOrder, idBranch, router]);

  const [orderNumber, setOrderNumber] = useState('');
  const [total, setTotal] = useState('');
  const [loading, setLoading] = useState(false);
  const canSubmit = orderNumber.trim() !== '' && total.trim() !== '';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { idBranch, idOrder, total, orderNumber, status: '4' };
      if (idCustomer) params.idCustomer = idCustomer;
      if (phoneNumber) params.phoneNumber = phoneNumber;
      await postReceipt(params);
      showSuccess(t('receiptSuccess'));
      router.replace('/dashboard');
    } catch (err) {
      showError(err instanceof Error ? err.message : t('failedToPost'));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Header title={t('addTotal')} showBack />
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md rounded-2xl bg-surface p-6 md:p-8 shadow-sm animate-fade-in">
          <h2 className="mb-6 text-xl font-bold text-text-primary">{t('orderDetails')}</h2>
          <div className="space-y-5">
            <Input label={t('orderNumber')} placeholder={t('enterOrderNumber')} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} validationState={orderNumber.length === 0 ? 'idle' : orderNumber.trim() ? 'valid' : 'invalid'} dir="ltr" />
            <Input label={t('receiptTotal')} type="number" placeholder="0.00" value={total} onChange={(e) => setTotal(e.target.value)} validationState={total.length === 0 ? 'idle' : parseFloat(total) > 0 ? 'valid' : 'invalid'} suffix="SAR" dir="ltr" />
            <Button onClick={handleSubmit} disabled={!canSubmit} loading={loading} className="w-full">{t('done')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
