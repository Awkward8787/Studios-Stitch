
import { Product, ProductVariant } from '../types';

/**
 * PRINTFUL API CONFIGURATION
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
        const errorMsg = data.error?.message || `API Error: ${response.status}`;
        console.error('Printful API Error:', data.error);
        throw new Error(errorMsg);
      }

      return data;
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      throw err;
    }
  }

  private async findCompatibleStore(): Promise<string> {
    try {
      const data = await this.proxyFetch('/stores');
      const stores = data.result || [];
      const apiStore = stores.find((s: any) => s.type === 'api' || s.type === 'manual');
      if (!apiStore) {
        if (stores.length > 0) return stores[0].id.toString();
        throw new Error("NO_STORES_FOUND");
      }
      return apiStore.id.toString();
    } catch (err: any) {
      throw new Error("PRINTFUL_SETUP_REQUIRED");
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      if (!this.activeStoreId) {
        this.activeStoreId = await this.findCompatibleStore();
      }

      const data = await this.proxyFetch('/store/products', this.activeStoreId);
      const rawProducts = data.result || [];

      if (rawProducts.length === 0) return [];

      const products: Product[] = [];
      const productsToFetch = rawProducts.slice(0, 12);
      
      for (const p of productsToFetch) {
        try {
          const detail = await this.getProduct(p.id.toString());
          if (detail) products.push(detail);
        } catch (e) {
          console.warn(`Skipping product ${p.id}`);
        }
      }

      return products;
    } catch (error: any) {
      console.error('Printful Service Failure:', error);
      throw error;
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const data = await this.proxyFetch(`/store/products/${id}`, this.activeStoreId || undefined);
      if (!data.result) return undefined;

      const { sync_product, sync_variants } = data.result;

      // Logic to find the "Ghost" 3D Model image
      // We look through all variants and their files for 'preview' types
      // Usually, the first 'preview' file is the ghost mannequin mockup
      const allImages = new Set<string>();
      let ghostMockupUrl = sync_product.thumbnail_url;
      
      const variantImages: string[] = [];
      sync_variants.forEach((v: any) => {
        v.files?.forEach((f: any) => {
          if (f.type === 'preview' && f.preview_url) {
            variantImages.push(f.preview_url);
            allImages.add(f.preview_url);
          }
        });
      });

      // Override primary thumbnail with the first ghost mockup if found
      if (variantImages.length > 0) {
        ghostMockupUrl = variantImages[0];
      }

      const variants: ProductVariant[] = sync_variants.map((v: any) => {
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
        description: sync_product.description || "Premium studio essential. High-density textile assembly.",
        thumbnail_url: ghostMockupUrl,
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
