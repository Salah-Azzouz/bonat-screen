import type { Merchant } from '@/types/merchant';

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; merchant: Merchant }> {
  const formBody = new URLSearchParams({ email, password }).toString();

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: '/login',
      body: formBody,
      headers: {},
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Invalid server response');
  }

  if (json.code !== 0) {
    throw new Error(json.errors?.[0] || 'Login failed');
  }

  const data = json.data;

  if (data.idStatus !== 1) {
    throw new Error('Account is not active');
  }

  // The API returns merchant fields flat in data, not nested
  const merchant: Merchant = {
    merchantImageUrl: data.merchantImageUrl || '',
    phoneNumber: data.phoneNumber || '',
    email: data.email || email,
    name: data.name || '',
    name_ar: data.name_ar || '',
    idSubscription: String(data.idSubscription || '1'),
    idMerchant: String(data.idMerchant || ''),
    idPos: data.idPos ? String(data.idPos) : '',
    posTitle: data.posTitle || '',
    baseVisit: data.baseVisit || '',
    link: data.link || '',
  };

  return { token: data.token, merchant };
}
