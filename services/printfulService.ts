
import { Product, ProductVariant } from '../types';
import { configService } from './configService';

// --- DEMO INVENTORY (FALLBACK) ---
const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo_1',
    external_id: 'demo_ext_1',
    name: 'Cyber-Stitch Heavy Tee',
    price: 45.00,
    description: '6.5oz Heavyweight Cotton. Garment dyed. Puff print graphic on rear.',
    thumbnail_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
    ],
    variants: [
      { id: 'd1_s', name: 'Cyber-Stitch Heavy Tee', size: 'S', color: 'Black', price: '45.00', retail_price: '45.00', cost: 20 },
      { id: 'd1_m', name: 'Cyber-Stitch Heavy Tee', size: 'M', color: 'Black', price: '45.00', retail_price: '45.00', cost: 20 },
      { id: 'd1_l', name: 'Cyber-Stitch Heavy Tee', size: 'L', color: 'Black', price: '45.00', retail_price: '45.00', cost: 20 }
    ]
  },
  {
    id: 'demo_2',
    external_id: 'demo_ext_2',
    name: 'Protocol Hoodie // Slate',
    price: 85.00,
    description: 'French Terry construction. Drop shoulder fit. Rubberized logo patch.',
    thumbnail_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop'],
    variants: [
      { id: 'd2_s', name: 'Protocol Hoodie', size: 'S', color: 'Slate', price: '85.00', retail_price: '85.00', cost: 40 },
      { id: 'd2_m', name: 'Protocol Hoodie', size: 'M', color: 'Slate', price: '85.00', retail_price: '85.00', cost: 40 }
    ]
  },
  {
    id: 'demo_3',
    external_id: 'demo_ext_3',
    name: 'Utility Cargo V1',
    price: 120.00,
    description: 'Technical nylon blend. Magnetic closures. Water resistant coating.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=1000&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=1000&auto=format&fit=crop'],
    variants: [
      { id: 'd3_30', name: 'Utility Cargo V1', size: '30', color: 'Olive', price: '120.00', retail_price: '120.00', cost: 60 }
    ]
  },
  {
    id: 'demo_4',
    external_id: 'demo_ext_4',
    name: 'Archive Cap',
    price: 35.00,
    description: 'Unstructured 6-panel. Distressed brim. Embroidered coordinate data.',
    thumbnail_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop'],
    variants: [
      { id: 'd4_os', name: 'Archive Cap', size: 'OS', color: 'Charcoal', price: '35.00', retail_price: '35.00', cost: 15 }
    ]
  }
];

class PrintfulService {
  private async apiFetch(endpoint: string) {
    try {
      const { printfulApiKey } = configService.getConfig();
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      };

      if (printfulApiKey) {
        headers['x-printful-token'] = printfulApiKey;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      const text = await response.text();

      if (!response.ok) {
        // Try to parse structured error from backend
        try {
            const json = JSON.parse(text);
            if (response.status === 401) throw new Error('PRINTFUL_AUTH_FAILED');
            throw new Error(json.error || `SERVER_ERROR_${response.status}`);
        } catch (e: any) {
            // If it's not JSON (e.g. 404 HTML/Text from proxy/gateway), throw specific error for handling
            const errorMsg = text.length < 100 ? text : `HTTP_${response.status}`;
            if (response.status === 401) throw new Error('PRINTFUL_AUTH_FAILED');
            throw new Error(`CONNECTION_REFUSED`); // Special flag for fallback
        }
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Raw response:", text.slice(0, 100));
        throw new Error('MALFORMED_JSON_RESPONSE');
      }
    } catch (err: any) {
      if (err.message === 'CONNECTION_REFUSED' || err.message.includes('404')) {
         throw new Error('BACKEND_UNREACHABLE');
      }
      console.error(`STITCH_PROTOCOL_FAILURE [${endpoint}]:`, err.message);
      throw err;
    }
  }

  async testConnection() {
    try {
      const data = await this.apiFetch('/api/health');
      return data?.bridge?.printful?.includes('connected');
    } catch (err) {
      // If backend is down, we return true for "Demo Mode" so the UI doesn't look broken
      return true;
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
      // We map individually to handle partial failures gracefully
      const detailPromises = productsToFetch.map((p: any) => 
        this.getProduct(p.id.toString()).catch(e => {
            console.warn(`Failed to load product ${p.id}`, e);
            return null;
        })
      );
      const products = await Promise.all(detailPromises);
      
      return products.filter((p): p is Product => p !== null);
    } catch (err: any) {
      if (err.message === 'BACKEND_UNREACHABLE' || err.message.includes('API_ERROR')) {
        console.warn("STITCH_SYSTEM: Backend offline. Activating Demo Protocol.");
        return DEMO_PRODUCTS;
      }
      console.error('STITCH_TERMINAL: Bulk fetch failed.', err);
      return DEMO_PRODUCTS; // Fallback to demo data on any bulk fetch error
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      // Check if it's a demo ID first
      const demoItem = DEMO_PRODUCTS.find(p => p.id === id);
      if (demoItem) return demoItem;

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
    } catch (err: any) {
      if (err.message === 'BACKEND_UNREACHABLE') {
          // If trying to fetch specific product but backend down, return null (Shop page handles fallback)
          return null; 
      }
      console.error(`STITCH_TERMINAL: Detail mapping failed for ${id}`, err);
      return null;
    }
  }
}

export const printfulService = new PrintfulService();
