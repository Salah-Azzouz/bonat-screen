'use client';

import { NumericKeypad } from './NumericKeypad';
import { t } from '@/lib/i18n';

interface PhoneKeypadProps {
  onSubmit: (phone: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
}

export function PhoneKeypad({ onSubmit, onCancel, loading, title }: PhoneKeypadProps) {
  return (
    <NumericKeypad
      title={title || t('phoneNumber')}
      placeholder="05XXXXXXXX"
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
      maxLength={10}
      submitLabel={t('send')}
    />
  );
}
