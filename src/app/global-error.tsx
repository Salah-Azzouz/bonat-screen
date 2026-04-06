'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Roboto, sans-serif',
          background: '#f9f6f8',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#4D4D4D' }}>
            Something went wrong
          </h2>
          <p style={{ marginTop: '0.5rem', color: '#707070', fontSize: '0.875rem' }}>
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF7746, #E54A92)',
              color: 'white',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
