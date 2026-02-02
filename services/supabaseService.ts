
import { User, Order, Review, WishlistItem, CommunityAsset } from '../types';

// Mock data helpers for LocalStorage Persistence
const STORAGE_KEYS = {
  REVIEWS: 'stitch_reviews',
  WISHLIST: 'stitch_wishlist',
  ASSETS: 'stitch_assets',
  ORDERS: 'stitch_orders'
};

const getStorage = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
};

const setStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Demo Assets
const DEMO_ASSETS: CommunityAsset[] = [
  {
    id: 'demo_asset_1',
    title: 'Neon Tokyo Drift',
    image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop',
    artist_name: 'Ghost_Protocol',
    description: 'Captured in Shinjuku.',
    status: 'approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'demo_asset_2',
    title: 'Cyber Deck V2',
    image_url: 'https://images.unsplash.com/photo-1592496001020-d31bd830651f?q=80&w=1000&auto=format&fit=crop',
    artist_name: 'Null_Pointer',
    description: 'Custom hardware aesthetics.',
    status: 'approved',
    created_at: new Date().toISOString()
  }
];

class SupabaseService {
  // This service now bridges the gap between Firebase Auth and local data persistence
  // allowing the app to run seamlessly without complex backend configuration.

  async getCurrentUser(): Promise<User | null> {
    // Auth is managed by Firebase in this configuration
    return null;
  }

  async signIn(email: string): Promise<void> {
    // Auth is managed by Firebase
  }

  async signOut() {
    // Auth is managed by Firebase
  }

  // --- ASSETS ---
  async getAssets(onlyApproved = true): Promise<CommunityAsset[]> {
    let assets = getStorage(STORAGE_KEYS.ASSETS);
    
    // Merge with demo assets if empty
    if (assets.length === 0) {
      assets = DEMO_ASSETS;
      setStorage(STORAGE_KEYS.ASSETS, assets);
    }

    if (onlyApproved) return assets.filter((a: any) => a.status === 'approved');
    return assets;
  }

  async addAsset(asset: Omit<CommunityAsset, 'id' | 'created_at' | 'status'>): Promise<CommunityAsset> {
    const assets = getStorage(STORAGE_KEYS.ASSETS);
    const newAsset = {
      ...asset,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: 'approved' // Auto-approve for seamless demo experience
    };
    assets.unshift(newAsset);
    setStorage(STORAGE_KEYS.ASSETS, assets);
    return newAsset as CommunityAsset;
  }

  async deleteAsset(id: string) {
    let assets = getStorage(STORAGE_KEYS.ASSETS);
    assets = assets.filter((a: any) => a.id !== id);
    setStorage(STORAGE_KEYS.ASSETS, assets);
  }

  // --- REVIEWS ---
  async getReviews(productId: string): Promise<Review[]> {
    const allReviews = getStorage(STORAGE_KEYS.REVIEWS);
    return allReviews.filter((r: any) => r.product_id === productId);
  }

  async addReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const reviews = getStorage(STORAGE_KEYS.REVIEWS);
    const newReview = {
      ...review,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    reviews.unshift(newReview);
    setStorage(STORAGE_KEYS.REVIEWS, reviews);
    return newReview as Review;
  }

  // --- WISHLIST ---
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const wishlist = getStorage(STORAGE_KEYS.WISHLIST);
    return wishlist.filter((w: any) => w.user_id === userId);
  }

  async toggleWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlist = getStorage(STORAGE_KEYS.WISHLIST);
    // Use productId to match WishlistItem interface
    const index = wishlist.findIndex((w: any) => w.user_id === userId && w.productId === productId);
    
    if (index >= 0) {
      wishlist.splice(index, 1);
      setStorage(STORAGE_KEYS.WISHLIST, wishlist);
      return false;
    } else {
      wishlist.push({
        id: crypto.randomUUID(),
        user_id: userId,
        productId: productId,
        addedAt: new Date().toISOString()
      });
      setStorage(STORAGE_KEYS.WISHLIST, wishlist);
      return true;
    }
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    return getStorage(STORAGE_KEYS.ORDERS);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const orders = getStorage(STORAGE_KEYS.ORDERS);
    return orders.filter((o: any) => o.user_id === userId);
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const orders = getStorage(STORAGE_KEYS.ORDERS);
    const order = orders.find((o: any) => o.id === id);
    if (order) {
      order.status = status;
      setStorage(STORAGE_KEYS.ORDERS, orders);
    }
  }

  async testConnection(): Promise<boolean> {
    // Local persistence is always online
    return true; 
  }
}

export const supabaseService = new SupabaseService();