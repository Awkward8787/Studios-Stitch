
import { User, Order } from '../types';

/**
 * SUPABASE AUTH CONFIG:
 * 
 * 1. Go to: Supabase Dashboard > Authentication > URL Configuration.
 * 2. Site URL: https://your-domain.com
 * 3. Redirect URLs:
 *    - http://localhost:3000/#/
 *    - https://your-domain.com/#/
 */

const MOCK_STORAGE_KEY = 'studios_stitch_mock_db';

class SupabaseService {
  private getStore() {
    const data = localStorage.getItem(MOCK_STORAGE_KEY);
    return data ? JSON.parse(data) : { users: [], orders: [], currentUser: null };
  }

  private saveStore(data: any) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  }

  async getCurrentUser(): Promise<User | null> {
    return this.getStore().currentUser;
  }

  async signIn(email: string): Promise<User> {
    const store = this.getStore();
    let user = store.users.find((u: User) => u.email === email);
    
    if (!user) {
      user = { id: Math.random().toString(36).substr(2, 9), email, role: email.includes('admin') ? 'admin' : 'user' };
      store.users.push(user);
    }
    
    store.currentUser = user;
    this.saveStore(store);
    return user;
  }

  async signOut() {
    const store = this.getStore();
    store.currentUser = null;
    this.saveStore(store);
  }

  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>): Promise<Order> {
    const store = this.getStore();
    const newOrder: Order = {
      ...order,
      id: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      created_at: new Date().toISOString(),
      status: 'pending'
    };
    store.orders.push(newOrder);
    this.saveStore(store);
    return newOrder;
  }

  async getOrders(): Promise<Order[]> {
    return this.getStore().orders;
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const store = this.getStore();
    const order = store.orders.find((o: Order) => o.id === orderId);
    if (order) order.status = status;
    this.saveStore(store);
  }
}

export const supabaseService = new SupabaseService();
