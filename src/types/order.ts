export interface Order {
  idOrder: string;
  idCustomer?: string;
  phoneNumber?: string;
  idCoupon?: string;
  total?: number | string;
  orderNumber?: string;
  link?: string;
  type?: 'new' | 'update';
  status?: string;
  totalPoints?: number;
  timedown?: number;
  fbsToken?: string;
  timestamp: number;
}
