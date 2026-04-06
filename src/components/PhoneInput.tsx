'use client';

import { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { isValidSaudiPhone } from '@/lib/validation';
import { t } from '@/lib/i18n';

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
  loading?: boolean;
  dark?: boolean;
}

export function PhoneInput({ onSubmit, loading, dark }: PhoneInputProps) {
  const [phone, setPhone] = useState('');

  const isValid = phone.length > 0 ? isValidSaudiPhone(phone) : false;
  const validationState =
    phone.length === 0 ? 'idle' : isValid ? 'valid' : 'invalid';

  return (
    <div className="space-y-3">
      <label className={`block text-sm font-medium ${dark ? 'text-white/70' : 'text-text-secondary'}`}>
        {t('phoneNumber')}
      </label>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            type="tel"
            placeholder="05XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            validationState={validationState as 'valid' | 'invalid' | 'idle'}
            dir="ltr"
          />
        </div>
        <Button
          onClick={() => onSubmit(phone)}
          disabled={!isValid}
          loading={loading}
          size="md"
        >
          {t('send')}
        </Button>
      </div>
    </div>
  );
}
