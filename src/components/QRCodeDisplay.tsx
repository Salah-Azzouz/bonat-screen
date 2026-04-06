'use client';

import { useEffect, useState } from 'react';
import { generateQRCodeDataURL } from '@/lib/qrcode';
import { Spinner } from './ui/LoadingSpinner';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
}

export function QRCodeDisplay({ data, size = 280 }: QRCodeDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    generateQRCodeDataURL(data, size).then(setQrUrl);
  }, [data, size]);

  if (!qrUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-white"
        style={{ width: size, height: size }}
      >
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <img
      src={qrUrl}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl"
    />
  );
}
