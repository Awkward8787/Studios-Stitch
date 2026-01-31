
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Order, Review, WishlistItem } from '../types';
import { configService } from './configService';

class SupabaseService {
  private client: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (this.client) return this.client;
    const { supabaseUrl, supabaseAnonKey } = configService.getConfig();
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("SUPABASE_NOT_CONFIGURED");
    this.client = createClient(supabaseUrl, supabaseAnonKey);
    return this.client;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Fetch profile for role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        role: (profile?.role as any) || 'user'
      };
    } catch {
      return null;
    }
  }

  async signIn(email: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
  }

  // --- REVIEWS ---
  async getReviews(productId: string): Promise<Review[]> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    } catch {
      return [];
    }
  }

  async addReview(review: Omit<Review, 'id' | 'created_at'>): Promise<Review> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();
    if (error) throw error;
    return data as Review;
  }

  // --- WISHLIST ---
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as WishlistItem[];
    } catch {
      return [];
    }
  }

  async toggleWishlist(userId: string, productId: string): Promise<boolean> {
    const supabase = this.getClient();
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      await supabase.from('wishlist').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('wishlist').insert([{ user_id: userId, product_id: productId }]);
      return true;
    }
  }

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    } catch {
      return [];
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    } catch {
      return [];
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  }

  async testConnection(): Promise<boolean> {
    try {
      const supabase = this.getClient();
      const { status } = await supabase.from('profiles').select('id').limit(1);
      return status !== 401;
    } catch {
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();
