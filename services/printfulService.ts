
import { Product, ProductVariant } from '../types';

class PrintfulService {
  private async apiFetch(endpoint: string) {
    try {
      // Points to our local server proxy /api/printful/...
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Proxy Error: ${response.status}`);
      }

      return data;
    } catch (err: any) {
      console.error('Printful Proxy Fetch failure:', err.message);
      throw err;
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      const data = await this.apiFetch('/api/printful/products');
      const rawProducts = data.result || [];

      if (rawProducts.length === 0) {
        console.warn("Printful Proxy: No products returned.");
        return [];
      }

      const products: Product[] = [];
      // Fetch details for the first 12 products
      const productsToFetch = rawProducts.slice(0, 12);
      
      for (const p of productsToFetch) {
        try {
          const detail = await this.getProduct(p.id.toString());
          if (detail) products.push(detail);
        } catch (e) {
          console.warn(`Skipping detail for ID: ${p.id}`);
        }
      }

      return products;
    } catch (error: any) {
      console.error('Printful Service Failure:', error);
      return [];
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const data = await this.apiFetch(`/api/printful/products/${id}`);
      if (!data.result) return undefined;

      const { sync_product, sync_variants } = data.result;

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
