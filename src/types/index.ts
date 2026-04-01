export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  promo?: string;
  protein?: string[];
  includes?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type MenuCategory =
  | 'tostadas'
  | 'burritos'
  | 'bowls'
  | 'nachos'
  | 'flautas'
  | 'quesadillas';

export interface Promo {
  id: string;
  name: string;
  description: string;
  includes: string;
  price: number;
  image: string;
  highlight?: boolean;
}

export interface CategoryOption {
  id: MenuCategory | 'todos';
  label: string;
  emoji: string;
}

export interface LocationData {
  lat: number;
  lng: number;
}

export interface CustomerData {
  firstName: string;
  lastName: string;
  cedula: string;
  email: string;
  countryCode: string;
  phone: string;
  address: string;
  reference?: string;
  location?: LocationData;
}

export interface Order {
  id: string;
  shortId: string;
  customer: CustomerData;
  items: CartItem[];
  total: number;
  currency: 'USD' | 'BS' | 'MIXED';
  exchange_rate?: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  timestamp: string;
  // Delivery
  deliveryPrice?: number;
  delivery_method?: 'DELIVERY' | 'PICKUP';
  // Payment Proofs
  reference?: string;
  paymentProof?: string;
  paymentFile?: File;
  usd_payment_method?: 'EFECTIVO' | 'ZELLE' | 'PAYPAL' | 'BINANCE' | 'BANESCO';
  zelle_email?: string;
  cash_bill_amount?: number;
  usd_payment_amount?: number;
  usd_payment_proof?: string;
}
