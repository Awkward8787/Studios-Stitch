
import { Product, ProductVariant } from '../types';

class PrintfulService {
  private async apiFetch(endpoint: string) {
    try {
      // Use absolute path to ensure we hit the backend correctly
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
      
      // Critical Check: If Hostinger returns HTML instead of JSON for an API call, it's a 404/Misconfig
      if (contentType && contentType.includes('text/html')) {
        console.error('STITCH_TERMINAL: Received HTML instead of JSON. The request likely hit a Hostinger 404 page or a redirect.');
        throw new Error("404: Node.js API not reached. Check Hostinger Node.js Dashboard status.");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Server Error ${response.status}`);
      return data;
    } catch (err: any) {
      console.error('STITCH_FETCH_ERROR:', err.message);
      throw err;
    }
  }

  async fetchProducts(): Promise<Product[]> {
    console.log('STITCH_TERMINAL: Initializing Inventory Sync...');
    try {
      const data = await this.apiFetch('/api/printful/products');
      const rawProducts = data?.result || [];
      
      if (rawProducts.length === 0) {
        console.warn('STITCH_TERMINAL: Sync complete. Result: 0 items found in the Printful store.');
        return [];
      }

      console.log(`STITCH_TERMINAL: Found ${rawProducts.length} items. Processing metadata...`);
      
      const products: Product[] = [];
      // We limit to the first 12 to ensure fast initial load
      const productsToFetch = rawProducts.slice(0, 12);
      
      // Use Promise.all to fetch details in parallel for better performance
      const detailPromises = productsToFetch.map((p: any) => this.getProduct(p.id.toString()));
      const results = await Promise.all(detailPromises);
      
      return results.filter((p): p is Product => p !== undefined);
    } catch (error: any) {
      console.error('STITCH_SYNC_FAILURE:', error.message);
      return [];
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const data = await this.apiFetch(`/api/printful/products/${id}`);
      if (!data?.result) return undefined;

      const { sync_product, sync_variants } = data.result;
      if (!sync_product || !sync_variants) return undefined;

      const allImages = new Set<string>();
      let primaryImg = sync_product.thumbnail_url;
      
      sync_variants.forEach((v: any) => {
        v.files?.forEach((f: any) => {
          if ((f.type === 'preview' || f.type === 'mockup') && f.preview_url) {
            allImages.add(f.preview_url);
            if (!primaryImg) primaryImg = f.preview_url;
          }
        });
      });

      const variants: ProductVariant[] = sync_variants.map((v: any) => ({
        id: v.id.toString(),
        name: v.name,
        size: v.size || 'OS',
        color: v.color || 'Standard',
        price: v.retail_price,
        retail_price: v.retail_price
      }));

      return {
        id: sync_product.id.toString(),
        external_id: sync_product.external_id || '',
        name: sync_product.name,
        price: parseFloat(sync_variants[0]?.retail_price || '0'),
        description: sync_product.description || "Premium studio essential.",
        thumbnail_url: primaryImg || sync_product.thumbnail_url,
        images: Array.from(allImages),
        variants
      };
    } catch (error) {
      console.error(`STITCH_PRODUCT_ERR [${id}]:`, error);
      return undefined;
    }
  }
}

export const printfulService = new PrintfulService();
