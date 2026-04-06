'use client';

import { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { t } from '@/lib/i18n';

interface CouponInputProps {
  onSubmit: (couponId: string) => void;
  loading?: boolean;
  dark?: boolean;
}

export function CouponInput({ onSubmit, loading, dark }: CouponInputProps) {
  const [couponId, setCouponId] = useState('');

  return (
    <div className="space-y-3">
      <label className={`block text-sm font-medium ${dark ? 'text-white/70' : 'text-text-secondary'}`}>
        {t('coupon')}
      </label>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t('enterCouponNumber')}
            value={couponId}
            onChange={(e) => setCouponId(e.target.value)}
            dir="ltr"
          />
        </div>
        <Button
          onClick={() => onSubmit(couponId)}
          disabled={!couponId.trim()}
          loading={loading}
          size="md"
        >
          {t('apply')}
        </Button>
      </div>
    </div>
  );
}
