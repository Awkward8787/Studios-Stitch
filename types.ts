
export interface Product {
  id: string;
  external_id: string;
  name: string;
  price: number;
  description: string;
  thumbnail_url: string;
  images: string[];
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  size: string;
  color: string;
  price: string; // Retail price set in store
  retail_price: string;
  cost: number; // Base cost charged by Printful
}

export interface CartItem extends Product {
  selectedSize: string;
  quantity: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Order {
  id: string;
  created_at: string;
  customer_email: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'shipped';
  stripe_session_id?: string;
  printful_order_id?: string; // Track the arbitrage fulfillment
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}
