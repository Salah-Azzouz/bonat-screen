import { apiPost } from './client';

export async function createOrder(
  idMerchant: string,
  idBranch: string,
  idOrder: string,
): Promise<string> {
  const formBody = new URLSearchParams({ idMerchant, idBranch, idOrder }).toString();

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: '/cf/createOrder',
      body: formBody,
      headers: {},
    }),
  });

  return res.text();
}

export async function updateOrder(
  idMerchant: string,
  idBranch: string,
  idOrder: string,
  phoneNumber: string,
): Promise<string> {
  const formBody = new URLSearchParams({
    idMerchant,
    idBranch,
    idOrder,
    phoneNumber,
  }).toString();

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: '/cf/updateOrder',
      body: formBody,
      headers: {},
    }),
  });

  return res.text();
}

export async function postReceipt(params: Record<string, string>): Promise<void> {
  await apiPost('/postReceipt', params);
}

export async function postSquareOrder(params: Record<string, string>): Promise<void> {
  await apiPost('/postSquareOrder', params);
}
