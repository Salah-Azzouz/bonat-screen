export interface Coupon {
  idCoupon: string;
  idCustomer: string;
  idCampaign: string;
  title: string;
  description: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  numAvailable: number;
  quantityLimit: number;
  usedDate: string;
  expirationDate: string;
  imageUrl: string[];
  isValid: number;
  isUsed: number;
  isReward: number;
  merchantImageUrl: string;
  idMerchant?: string;
}
