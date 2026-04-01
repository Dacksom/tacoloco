
export interface SubItem {
  id: string;
  name: string;
  image: string;
  menuImage?: string;
  description?: string;
  price?: number;
  category?: string;       // [NEW] Added for DB mapping
  stock_status?: boolean;  // [NEW] Added for DB mapping
  display_order?: number;  // [NEW] Added for DB mapping
  available_for?: ProductType[]; // [NEW] Which product types can use this ingredient
}

export type ProductType = 'SANDWICH' | 'SALAD' | 'PIZZA' | 'OTHER';
export type ProductSize = '15cm' | '30cm' | 'N/A';

export interface CustomizedSub {
  id: string;
  name?: string; // [NEW] From DB order_items
  type: ProductType;
  size: ProductSize;
  bread?: SubItem; // Opcional porque la ensalada no tiene pan
  protein: SubItem;
  extraProtein?: SubItem; // Ahora es un objeto completo, no un booleano
  extras: SubItem[]; // Embutidos/Quesos
  veggies: SubItem[];
  sauces: SubItem[];
  price: number;
  beverage?: string;
  customerName?: string; // [NEW] Nombre de la persona que comerá el sub
  configuration?: any;   // [NEW] JSON string or object from DB
  quantity?: number;     // [NEW] Quantity for OTHER type items (default 1)
  status?: OrderItemStatus; // [NEW] KDS Status
}

export interface OptionCategory {
  title: string;
  items: SubItem[];
  limit?: number; // Límite por defecto, puede ser anulado por lógica de negocio
}

export enum ViewMode {
  HOME = 'HOME',
  MENU = 'MENU',
  BUILDER = 'BUILDER',
  PROPOSAL = 'PROPOSAL',
  CHECKOUT = 'CHECKOUT',
  ADMIN = 'ADMIN',
  KITCHEN = 'KITCHEN',
  LOGIN = 'LOGIN'
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID_VERIFYING'
  | 'PREPARING'
  | 'KITCHEN_READY'
  | 'READY_FOR_PICKUP'
  | 'ON_WAY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING'     // Keeping for backward compat / UI
  | 'PROCESSING'  // Keeping for backward compat / UI
  | 'READY';      // Keeping for backward compat / UI

export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY';

export interface CustomerData {
  firstName: string;
  lastName: string;
  cedula: string;
  email: string;
  countryCode: string;
  phone: string;
  address?: string;
  location?: { lat: number; lng: number };
}

export interface Order {
  id: string;
  shortId: string;
  short_id?: string; // [NEW] From DB
  customer: CustomerData;
  customer_info?: { // [NEW] From DB
    name: string;
    phone: string;
    address?: string;
    location?: any;
  };
  items: CustomizedSub[];
  total: number;
  total_amount?: number; // [NEW] From DB
  deliveryPrice: number;
  delivery_fee?: number; // [NEW] From DB
  currency: 'USD' | 'BS' | 'MIXED';
  status: OrderStatus;
  timestamp: number;
  created_at?: string; // [NEW] From DB
  reference?: string;
  payment_reference?: string; // [NEW] From DB
  paymentProof?: string;
  payment_proof?: string; // [NEW] From DB
  paymentFile?: File;     // [NEW] For file upload in Checkout
  driver_id?: string;     // [NEW] From DB
  driver?: Driver;       // [NEW] Joined From DB
  // Payment Verification Fields
  usd_payment_method?: 'EFECTIVO' | 'ZELLE' | 'PAYPAL' | 'BINANCE' | 'BANESCO';
  zelle_email?: string; // Also used to store titular name for all USD payment methods
  titular_name?: string; // Alias for zelle_email (frontend use)
  cash_bill_amount?: number; // Denomination of bill for cash payment (e.g., 20, 50, 100)
  // Delivery Method
  delivery_method?: 'DELIVERY' | 'PICKUP';
  // Mixed Payment Fields
  usd_payment_amount?: number;
  usd_payment_proof?: string;
}

export interface Driver {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  active: boolean;
  total_assignments: number;
  completed_assignments: number;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string; // Desktop/Web
  mobile_image_url?: string; // [NEW] Mobile responsive version
  active: boolean;
  display_order: number;
}

export interface Coupon {
  code: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_amount: number;
  active: boolean;
  max_uses?: number;
  uses_count: number;
  expires_at?: string;
}
