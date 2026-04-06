'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('❌ [App] Unhandled error caught:', error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bonat-bg p-6">
      <div className="text-center">
        <h2 className="text-xl font-medium text-bonat-dark">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-bonat-gray">
          {error.message || 'An unexpected error occurred'}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
