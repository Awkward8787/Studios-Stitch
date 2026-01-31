
import { Product, ProductVariant } from '../types';

class PrintfulService {
  private async apiFetch(endpoint: string) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const rawText = await response.text();
      const contentType = response.headers.get('content-type');
      
      // If we got a text 404, LiteSpeed/Hostinger is blocking the request before Node.js sees it
      if (response.status === 404 && !contentType?.includes('json')) {
        console.error('STITCH_CRITICAL: Request hit a 404 page. The Node.js server did not receive this request.');
        throw new Error(`STITCH_TERMINAL_404: Check that no 'api' folder exists in public_html and ensure Node app is running on Hostinger.`);
      }

      if (contentType && contentType.includes('application/json')) {
        const data = JSON.parse(rawText);
        if (!response.ok) throw new Error(data.error || `Server Error ${response.status}`);
        return data;
      } else {
        throw new Error(`Protocol Error: Received ${contentType} instead of JSON. Check backend status.`);
      }
    } catch (err: any) {
      console.error('STITCH_FETCH_FAILURE:', err.message);
      throw err;
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      const data = await this.apiFetch('/api/printful/products');
      const rawProducts = data?.result || [];
      if (rawProducts.length === 0) return [];

      const products: Product[] = [];
      const productsToFetch = rawProducts.slice(0, 12);
      
      for (const p of productsToFetch) {
        const detail = await this.getProduct(p.id.toString());
        if (detail) products.push(detail);
      }
      return products;
    } catch (error: any) {
      console.error('Inventory Sync Failure:', error.message);
      return [];
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const data = await this.apiFetch(`/api/printful/products/${id}`);
      if (!data?.result) return undefined;

      const { sync_product, sync_variants } = data.result;
      const allImages = new Set<string>();
      let primaryImg = sync_product.thumbnail_url;
      
      sync_variants.forEach((v: any) => {
        v.files?.forEach((f: any) => {
          if (f.type === 'preview' && f.preview_url) {
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
        thumbnail_url: primaryImg,
        images: Array.from(allImages),
        variants
      };
    } catch (error) {
      return undefined;
    }
  }
}

export const printfulService = new PrintfulService();
