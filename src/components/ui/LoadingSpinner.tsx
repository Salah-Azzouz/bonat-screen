'use client';

/** Inline spinner for non-button contexts. Prefer Button's loading prop when possible. */
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-brand-orange border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}
