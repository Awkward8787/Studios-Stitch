
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CartItem } from '../types';
import { configService } from './configService';

class StripeService {
  private stripePromise: Promise<Stripe | null> | null = null;

  private getStripe() {
    const { stripePublicKey } = configService.getConfig();
    if (!stripePublicKey) return null;
    
    if (!this.stripePromise) {
      this.stripePromise = loadStripe(stripePublicKey);
    }
    return this.stripePromise;
  }

  async createCheckoutSession(items: CartItem[], customerEmail: string): Promise<{ url: string }> {
    const response = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, customerEmail })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initialize checkout session.');
    }

    return await response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      const { stripePublicKey } = configService.getConfig();
      return !!stripePublicKey;
    } catch {
      return false;
    }
  }
}

export const stripeService = new StripeService();
