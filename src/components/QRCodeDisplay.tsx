'use client';

import { useEffect, useState } from 'react';
import { generateQRCodeDataURL } from '@/lib/qrcode';
import { Spinner } from './ui/LoadingSpinner';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
}

export function QRCodeDisplay({ data, size = 350 }: QRCodeDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    generateQRCodeDataURL(data, size).then(setQrUrl);
  }, [data, size]);

  if (!qrUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-surface shadow-sm"
        style={{ width: size, height: size }}
      >
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-6 shadow-sm animate-fade-in">
      <img src={qrUrl} alt="QR Code" width={size} height={size} className="rounded-lg" />
    </div>
  );
}
