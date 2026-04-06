import { apiGet } from './client';
import type { Merchant } from '@/types/merchant';

export async function getMerchantProfile(): Promise<Merchant> {
  return apiGet<Merchant>('/merchant');
}
