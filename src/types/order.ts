export interface Order {
  idOrder: string;
  idCustomer?: string;
  phoneNumber?: string;
  idCoupon?: string;
  total?: string;
  orderNumber?: string;
  link?: string;
  type?: 'new' | 'update';
  status?: string;
  timestamp: number;
}
