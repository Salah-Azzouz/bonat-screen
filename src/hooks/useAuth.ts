'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { login as loginApi } from '@/lib/api/auth';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: ({ token, merchant }) => {
      setAuth(token, merchant);
    },
  });
}
