
import { Product, ProductVariant } from '../types';

/**
 * PRINTFUL API CONFIGURATION (Based on OpenAPI Spec)
 * 
 * 1. APP REGISTRATION (What to put in Printful Dashboard):
 *    If you are creating an "App" at developers.printful.com:
 *    - Application URL: http://localhost:3000
 *    - Redirect URI: http://localhost:3000/
 * 
 * 2. AUTHENTICATION:
 *    - Using your Private Token: 'KwSxNJ1mHlNYUJZ57eqOIAXQXQ9250Q19a2CHEas'
 *    - For account-level tokens, the 'X-PF-Store-Id' header is required.
 * 
 * 3. RATE LIMITS:
 *    - 120 calls/min. Our app fetches products in a batch to stay safe.
 */

const PRINTFUL_API_URL = 'https://api.printful.com';
const API_KEY = 'KwSxNJ1mHlNYUJZ57eqOIAXQXQ9250Q19a2CHEas';
const PROXY_URL = 'https://corsproxy.io/?';

class PrintfulService {
  private activeStoreId: string | null = null;

  private async proxyFetch(endpoint: string, storeId?: string) {
    const targetUrl = `${PRINTFUL_API_URL}${endpoint}`;
    const proxiedUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // The OpenAPI spec confirms this header name for account-level tokens
    if (storeId) {
      headers['X-PF-Store-Id'] = storeId;
    }

    try {
      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific API error codes from the spec
        const errorMsg = data.error?.message || `API Error: ${response.status}`;
        console.error('Printful API Error:', data.error);
        
        if (response.status === 401) throw new Error("UNAUTHORIZED_TOKEN");
        if (response.status === 400 && errorMsg.includes("Manual Order")) throw new Error("STORE_TYPE_MISMATCH");
        
        throw new Error(errorMsg);
      }

      return data;
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      throw err;
    }
  }

  /**
   * Finds the first compatible 'api' or 'manual' store in the account.
   * Required to satisfy the "Products API" requirements for non-synced platforms.
   */
  private async findCompatibleStore(): Promise<string> {
    try {
      const data = await this.proxyFetch('/stores');
      const stores = data.result || [];
      
      // Look for manual/api stores first as per spec for the /store/products endpoint
      const apiStore = stores.find((s: any) => s.type === 'api' || s.type === 'manual');
      
      if (!apiStore) {
        // Fallback to the first available store if none are explicit API types
        if (stores.length > 0) return stores[0].id.toString();
        throw new Error("NO_STORES_FOUND");
      }
      
      return apiStore.id.toString();
    } catch (err: any) {
      console.error("Store discovery failed:", err);
      throw new Error("PRINTFUL_SETUP_REQUIRED");
    }
  }

  /**
   * Fetches products using the /store/products endpoint (Products API)
   * which is recommended for the "Manual Order / API" platform.
   */
  async fetchProducts(): Promise<Product[]> {
    try {
      if (!this.activeStoreId) {
        this.activeStoreId = await this.findCompatibleStore();
      }

      const data = await this.proxyFetch('/store/products', this.activeStoreId);
      const rawProducts = data.result || [];

      if (rawProducts.length === 0) return [];

      const products: Product[] = [];
      // Fetch details for the first few products (respecting rate limits)
      const productsToFetch = rawProducts.slice(0, 12);
      
      for (const p of productsToFetch) {
        try {
          const detail = await this.getProduct(p.id.toString());
          if (detail) products.push(detail);
        } catch (e) {
          console.warn(`Skipping product ${p.id} due to fetch error.`);
        }
      }

      return products;
    } catch (error: any) {
      console.error('Printful Service Failure:', error);
      throw error;
    }
  }

  /**
   * Gets details for a specific Sync Product.
   * Merges sync_product info with sync_variants as per API structure.
   */
  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const data = await this.proxyFetch(`/store/products/${id}`, this.activeStoreId || undefined);
      if (!data.result) return undefined;

      const { sync_product, sync_variants } = data.result;

      // Collect all unique preview/mockup images from variant files
      const allImages = new Set<string>();
      if (sync_product.thumbnail_url) allImages.add(sync_product.thumbnail_url);
      
      sync_variants.forEach((v: any) => {
        v.files?.forEach((f: any) => {
          if (f.preview_url) allImages.add(f.preview_url);
          else if (f.url) allImages.add(f.url);
        });
      });

      const variants: ProductVariant[] = sync_variants.map((v: any) => {
        // Extract size/color from name if not explicitly provided in variant props
        const nameParts = v.name.split(' - ');
        const optionParts = nameParts[1]?.split(' / ') || [];
        
        return {
          id: v.id.toString(),
          name: v.name,
          size: v.size || optionParts[1] || optionParts[0] || 'OS',
          color: v.color || optionParts[0] || 'Standard',
          price: v.retail_price,
          retail_price: v.retail_price
        };
      });

      return {
        id: sync_product.id.toString(),
        external_id: sync_product.external_id || '',
        name: sync_product.name,
        price: parseFloat(sync_variants[0]?.retail_price || '0'),
        description: sync_product.description || "Premium studio essential, tailored for the modern creative. High-quality construction and refined aesthetic.",
        thumbnail_url: sync_product.thumbnail_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
        images: Array.from(allImages),
        variants
      };
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return undefined;
    }
  }
}

export const printfulService = new PrintfulService();
