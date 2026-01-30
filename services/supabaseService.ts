
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Order } from '../types';
import { configService } from './configService';

class SupabaseService {
  private client: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const { supabaseUrl, supabaseAnonKey } = configService.getConfig();
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("SUPABASE_NOT_CONFIGURED");
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
    return this.client;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const supabase = this.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return {
        id: user.id,
        email: user.email || '',
        role: (user.app_metadata?.role as any) || 'user'
      };
    } catch {
      return null;
    }
  }

  async signIn(email: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  async devSignIn(email: string): Promise<User> {
    return {
      id: 'dev-user-id',
      email,
      role: email.includes('admin') ? 'admin' : 'user'
    };
  }

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>): Promise<Order> {
    const supabase = this.getClient();
    const orderId = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newOrder = {
      id: orderId,
      customer_email: order.customer_email,
      total: order.total,
      items: order.items,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([newOrder])
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  }

  async getOrders(): Promise<Order[]> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    } catch (err) {
      console.warn("Backend not reachable or orders table missing.");
      return [];
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const supabase = this.getClient();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
  }

  async testConnection(): Promise<boolean> {
    try {
      const supabase = this.getClient();
      // Fixed: Destructure status from the response instead of trying to access it on the error object.
      const { error, status } = await supabase.from('orders').select('id').limit(1);
      // If table doesn't exist it's a 404 but connection is technically OK
      return !error || (error.code !== 'PGRST301' && status !== 401);
    } catch {
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();