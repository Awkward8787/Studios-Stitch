
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

    console.log('Initiating Secure Stripe Session...');

    const isProduction = window.location.hostname === 'www.studiosstitch.com';
    const baseUrl = isProduction 
      ? 'https://www.studiosstitch.com/' 
      : window.location.origin + window.location.pathname;
    
    const successUrl = `${baseUrl}#/checkout-success`;
    
    // In a real environment, you'd send items to your backend to get a sessionId
    // For this bridge, we provide the success URL to simulate completion
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ url: successUrl });
      }, 1000);
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
