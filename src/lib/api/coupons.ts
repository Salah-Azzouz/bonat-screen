import { apiGet, apiPost } from './client';
import type { Coupon } from '@/types/coupon';

export async function getCouponByCouponId(idCoupon: string): Promise<Coupon> {
  return apiGet<Coupon>(`/campaignByCouponId?idCoupon=${idCoupon}`);
}

export async function markCouponUsed(idCoupon: string): Promise<void> {
  await apiPost('/usedCoupon', { idCoupon });
}
