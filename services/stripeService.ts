
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
    const { stripePublicKey } = configService.getConfig();
    if (!stripePublicKey) {
      throw new Error("STRIPE_NOT_CONFIGURED");
    }

    console.warn('STUDIO_STITCH: Attempting Checkout Bridge...');
    console.info('IMPLEMENTATION_NOTE: In production, you must call a secure server-side endpoint (e.g. Supabase Edge Function) to create a real Stripe Session using your Secret Key.');

    // Simulate the redirect for demo purposes
    const isProduction = window.location.hostname === 'www.studiosstitch.com';
    const baseUrl = isProduction 
      ? 'https://www.studiosstitch.com/' 
      : window.location.origin + window.location.pathname;
    
    const successUrl = `${baseUrl}#/checkout-success`;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ url: successUrl });
      }, 1500);
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const stripe = await this.getStripe();
      return !!stripe;
    } catch {
      return false;
    }
  }
}

export const stripeService = new StripeService();
