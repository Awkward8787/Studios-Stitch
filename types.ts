
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
  price: string;
  retail_price: string;
  cost: number;
}

export interface CartItem extends Product {
  selectedSize: string;
  quantity: number;
}

export interface CommunityAsset {
  id: string;
  title: string;
  image_url: string;
  artist_name: string;
  description?: string;
  created_at: string;
  status: 'pending' | 'approved';
  user_id?: string;
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
  productId: string;
  variantId?: string;
  addedAt: any;
  productSnapshot?: Partial<Product>;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'canceled' | 'completed' | 'pending';
  total: number;
  currency: string;
  createdAt: any;
  items: CartItem[];
  customer_email: string; // kept for compatibility
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

// --- DASHBOARD TYPES ---
export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: any;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: any;
}

export interface CollectionItem {
  id: string;
  productId: string;
  addedAt: any;
  productSnapshot?: Partial<Product>;
}

export interface Download {
  id: string;
  type: 'receipt' | 'mockup' | 'design_export' | 'other';
  title: string;
  downloadURL?: string;
  size?: string;
  createdAt: any;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  createdAt: any;
}