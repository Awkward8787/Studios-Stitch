
import { Product, ProductVariant } from '../types';

class PrintfulService {
  private async apiFetch(endpoint: string) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        console.error(`STITCH_TERMINAL: Route ${endpoint} returned HTML. Bridge disruption detected.`);
        throw new Error("SERVER_OFFLINE: HTML_RESPONSE_IN_JSON_PIPE");
      }

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) throw new Error('PRINTFUL_AUTH_FAILED');
        throw new Error(data.error || `Server Error ${response.status}`);
      }
      return data;
    } catch (err: any) {
      console.error('STITCH_PROTOCOL_FAILURE:', err.message);
      throw err;
    }
  }

  async testConnection() {
    try {
      const data = await this.apiFetch('/api/health');
      return data?.bridge?.printful?.includes('connected');
    } catch (err) {
      return false;
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      const data = await this.apiFetch('/api/printful/products');
      // API v2 returns items in 'data', v1 used 'result'
      const rawProducts = data?.data || data?.result || [];
      
      if (rawProducts.length === 0) return [];

      const productsToFetch = rawProducts.slice(0, 12);
      const detailPromises = productsToFetch.map((p: any) => this.getProduct(p.id.toString()));
      const products = await Promise.all(detailPromises);
      return products.filter((p): p is Product => p !== null);
    } catch (err: any) {
      throw err;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const data = await this.apiFetch(`/api/printful/products/${id}`);
      // Handle v2 detail structure
      const result = data?.data || data?.result;
      if (!result) return null;

      const syncProduct = result.sync_product || result;
      const syncVariants = result.sync_variants || [];

      const images: string[] = [];
      syncVariants.forEach((v: any) => {
        v.files?.forEach((f: any) => {
          if ((f.type === 'preview' || f.type === 'mockup') && f.preview_url && !images.includes(f.preview_url)) {
            images.push(f.preview_url);
          }
        });
      });

      const variants: ProductVariant[] = syncVariants.map((v: any) => {
        // ARBITRAGE CORE: Extracting production cost from the 'variant' object inside 'sync_variant'
        // In v2, v.variant.price is the Printful base cost.
        const printfulCost = parseFloat(v.variant?.price || v.retail_price || '0');
        const retailPrice = parseFloat(v.retail_price || '0');
        
        return {
          id: v.id.toString(),
          name: v.name,
          size: v.size || v.variant?.size || 'OS',
          color: v.color || v.variant?.color || 'N/A',
          price: retailPrice.toString(),
          retail_price: retailPrice.toString(),
          cost: printfulCost > 0 ? printfulCost : retailPrice * 0.6 // Fallback logic
        };
      });

      return {
        id: syncProduct.id.toString(),
        external_id: syncProduct.external_id,
        name: syncProduct.name,
        price: parseFloat(variants[0]?.retail_price || '0'),
        description: syncProduct.description || `STITCH_ARCHIVE_UNIT_${syncProduct.id}. Precision engineered textile.`,
        thumbnail_url: syncProduct.thumbnail_url || images[0] || '',
        images: images.length > 0 ? images : [syncProduct.thumbnail_url],
        variants
      };
    } catch (err) {
      console.error(`STITCH_TERMINAL: Failed to resolve unit ${id}`, err);
      return null;
    }
  }
}

export const printfulService = new PrintfulService();
