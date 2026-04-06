'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { STORAGE_KEYS } from '@/lib/constants';
import { useToastContext } from '@/providers/ToastProvider';
import { t } from '@/lib/i18n';

export default function ChangeMerchantImagePage() {
  const router = useRouter();
  const { showSuccess, showError } = useToastContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showError('Invalid file'); return; }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maxSize = 800;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = (height / width) * maxSize; width = maxSize; }
        else { width = (width / height) * maxSize; height = maxSize; }
      }
      canvas.width = width; canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      setPreview(canvas.toDataURL('image/jpeg', 0.7));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSave = () => {
    if (!preview) return;
    localStorage.setItem(STORAGE_KEYS.MERCHANT_IMAGE, preview);
    showSuccess(t('imageSaved'));
    router.back();
  };

  return (
    <div className="flex h-screen flex-col bg-bg">
      <Header title={t('merchantBackground')} showOk={!!preview} onOk={handleSave} />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8">
        {preview ? (
          <div className="relative">
            <div className="h-52 w-52 overflow-hidden rounded-2xl shadow-sm"><img src={preview} alt="Preview" className="h-full w-full object-cover" /></div>
            <button onClick={() => setPreview(null)} className="absolute -top-2 -end-2 flex h-8 w-8 items-center justify-center rounded-full bg-error text-white shadow-md hover:bg-error/90">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="flex h-52 w-52 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface hover:border-brand-orange hover:bg-brand-orange/5 transition-colors">
            <svg className="h-10 w-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm text-text-muted">{t('tapToSelectImage')}</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        {!preview && <Button onClick={() => fileInputRef.current?.click()}>{t('selectImage')}</Button>}
      </div>
    </div>
  );
}
