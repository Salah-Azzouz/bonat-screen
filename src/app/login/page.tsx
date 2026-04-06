'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isValidEmail } from '@/lib/validation';
import { useLogin } from '@/hooks/useAuth';
import { useToastContext } from '@/providers/ToastProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { t } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const { showError } = useToastContext();

  const [email, setEmail] = useState('multi@bonat.io');
  const [password, setPassword] = useState('Multi@123');
  const [loading, setLoading] = useState(false);

  const emailValid = email.length > 0 ? isValidEmail(email) : null;
  const passwordValid = password.length > 0 ? password.length >= 3 : null;
  const canSubmit = emailValid === true && passwordValid === true;

  const emailState = emailValid === null ? 'idle' : emailValid ? 'valid' : 'invalid';
  const passwordState = passwordValid === null ? 'idle' : passwordValid ? 'valid' : 'invalid';

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await loginMutation.mutateAsync({ email, password });
      router.replace('/branches');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-brand-dark">
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-4 relative">
        <img src="/images/logo.png" alt="Bonat" className="h-16 w-auto" />
        <p className="text-white/40 text-sm">{t('merchantPortal')}</p>
        <div className="absolute top-4 right-4">
          <LanguageToggle variant="dark" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-bg p-8 lg:max-w-lg lg:rounded-s-3xl">
        <div className="w-full max-w-sm animate-fade-in">
          <img src="/images/logo.png" alt="Bonat" className="mb-8 h-10 w-auto lg:hidden" />
          <h1 className="text-2xl font-bold text-text-primary">{t('welcomeBack')}</h1>
          <p className="mt-1 mb-8 text-sm text-text-secondary">{t('signInToAccount')}</p>

          <div className="space-y-5">
            <Input label={t('email')} type="email" placeholder={t('enterYourEmail')} value={email} onChange={(e) => setEmail(e.target.value)} validationState={emailState as 'valid' | 'invalid' | 'idle'} dir="ltr" autoComplete="email" />
            <Input label={t('password')} type="password" placeholder={t('enterYourPassword')} value={password} onChange={(e) => setPassword(e.target.value)} validationState={passwordState as 'valid' | 'invalid' | 'idle'} dir="ltr" autoComplete="current-password" />
            <Button onClick={handleLogin} disabled={!canSubmit} loading={loading} className="w-full">
              {t('signIn')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
