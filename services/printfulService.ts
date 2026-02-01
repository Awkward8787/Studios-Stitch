
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

      const text = await response.text();
      let data: any;
      
      try {
        data = JSON.parse(text.trim());
      } catch (e) {
        throw new Error(`MALFORMED_RESPONSE: ${text.slice(0, 50)}...`);
      }

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
      const rawProducts = data?.result || data?.data || [];
      
      if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
        console.warn('STITCH_TERMINAL: No products found. Verify items are "Sync Products" in Printful.');
        return [];
      }

      const productsToFetch = rawProducts.slice(0, 24);
      const detailPromises = productsToFetch.map((p: any) => this.getProduct(p.id.toString()));
      const products = await Promise.all(detailPromises);
      
      return products.filter((p): p is Product => p !== null);
    } catch (err: any) {
      console.error('STITCH_TERMINAL: Bulk fetch failed.', err);
      throw err;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const data = await this.apiFetch(`/api/printful/products/${id}`);
      const body = data?.result || data?.data || data;
      
      if (!body) return null;

      const syncProduct = body.sync_product || body;
      const rawVariants = body.sync_variants || body.variants || [];

      if (!Array.isArray(rawVariants) || rawVariants.length === 0) return null;

      const images: string[] = [];
      if (syncProduct.thumbnail_url) images.push(syncProduct.thumbnail_url);

      rawVariants.forEach((v: any) => {
        const files = v.files || [];
        files.forEach((f: any) => {
          if ((f.type === 'preview' || f.preview_url) && f.preview_url) {
            if (!images.includes(f.preview_url)) images.push(f.preview_url);
          }
        });
      });

      const variants: ProductVariant[] = rawVariants.map((v: any) => {
        const retailPrice = parseFloat(v.retail_price || syncProduct.retail_price || '0');
        const cost = parseFloat(v.variant?.price || v.cost || (retailPrice * 0.6).toString());

        return {
          id: v.id.toString(),
          name: v.name || syncProduct.name,
          size: v.size || v.variant?.size || 'OS',
          color: v.color || v.variant?.color || 'N/A',
          price: retailPrice > 0 ? retailPrice.toString() : '0',
          retail_price: retailPrice > 0 ? retailPrice.toString() : '0',
          cost: cost
        };
      });

      if (!syncProduct.name || images.length === 0) return null;

      return {
        id: syncProduct.id.toString(),
        external_id: syncProduct.external_id || '',
        name: syncProduct.name,
        price: parseFloat(variants[0]?.retail_price || '0'),
        description: syncProduct.description || 'Premium Studios Stitch technical apparel.',
        thumbnail_url: images[0],
        images: images,
        variants
      };
    } catch (err) {
      console.error(`STITCH_TERMINAL: Detail mapping failed for ${id}`, err);
      return null;
    }
  }
}

export const printfulService = new PrintfulService();
