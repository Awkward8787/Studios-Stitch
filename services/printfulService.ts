
import { Product, ProductVariant } from '../types';

class PrintfulService {
  private async apiFetch(endpoint: string) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${window.location.origin}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        throw new Error("SERVER_MISCONFIG: Received HTML instead of JSON. Check backend routing.");
      }

      const data = await response.json();
      if (!response.ok) {
        // Pass through specific auth errors
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
      return data.bridge?.printful === 'connected';
    } catch {
      return false;
    }
  }

  async fetchProducts(): Promise<Product[]> {
    console.log('STITCH_TERMINAL: Initializing Inventory Sync...');
    try {
      const data = await this.apiFetch('/api/printful/products');
      const rawProducts = data?.result || [];
      
      if (rawProducts.length === 0) {
        console.warn('STITCH_TERMINAL: Store returned 0 sync products.');
        return [];
      }

      const productsToFetch = rawProducts.slice(0, 16);
      const detailPromises = productsToFetch.map((p: any) => this.getProduct(p.id.toString()));
      const products = await Promise.all(detailPromises);
      return products.filter((p): p is Product => p !== null);
    } catch (err: any) {
      if (err.message === 'PRINTFUL_AUTH_FAILED') {
        console.error('STITCH_TERMINAL: Printful authentication failed. Check your token.');
      }
      throw err;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const data = await this.apiFetch(`/api/printful/products/${id}`);
      const result = data.result;
      if (!result) return null;

      const syncProduct = result.sync_product;
      const syncVariants = result.sync_variants || [];

      const images: string[] = [];
      syncVariants.forEach((v: any) => {
        v.files?.forEach((f: any) => {
          if (f.type === 'preview' && f.preview_url && !images.includes(f.preview_url)) {
            images.push(f.preview_url);
          }
        });
      });

      const variants: ProductVariant[] = syncVariants.map((v: any) => ({
        id: v.id.toString(),
        name: v.name,
        size: v.size || 'OS',
        color: v.color || 'N/A',
        price: v.retail_price,
        retail_price: v.retail_price
      }));

      return {
        id: syncProduct.id.toString(),
        external_id: syncProduct.external_id,
        name: syncProduct.name,
        price: parseFloat(syncVariants[0]?.retail_price || '0'),
        description: syncProduct.description || `STITCH_ARCHIVE_UNIT_${syncProduct.id}. Engineered for modern utility.`,
        thumbnail_url: syncProduct.thumbnail_url || images[0] || '',
        images: images.length > 0 ? images : [syncProduct.thumbnail_url],
        variants
      };
    } catch (err) {
      console.error(`STITCH_TERMINAL: Failed to fetch product ${id}`, err);
      return null;
    }
  }
}

export const printfulService = new PrintfulService();
