'use client';

import type { Merchant } from '@/types/merchant';
import { STORAGE_KEYS } from '@/lib/constants';

interface MerchantHeaderProps {
  merchant: Merchant;
  variant?: 'light' | 'dark';
}

export function MerchantHeader({ merchant, variant = 'light' }: MerchantHeaderProps) {
  const savedImage =
    typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.MERCHANT_IMAGE)
      : null;

  const imageUrl = savedImage || merchant.merchantImageUrl || '/images/default-user-image.png';
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/20">
        <img
          src={imageUrl}
          alt={merchant.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/default-user-image.png';
          }}
        />
      </div>
      <div className="min-w-0">
        <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-text-primary'}`}>
          {merchant.name_ar || merchant.name}
        </p>
        <p className={`text-xs truncate ${isDark ? 'text-white/60' : 'text-text-muted'}`}>
          {merchant.name_ar ? merchant.name : merchant.email}
        </p>
      </div>
    </div>
  );
}
