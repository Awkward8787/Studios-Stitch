
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { printfulService } from '../services/printfulService';

interface ShopProps {
  products: Product[];
  onAddToCart: (product: Product, size: string) => void;
}

const Shop: React.FC<ShopProps> = ({ products: initialProducts, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProducts.length === 0) {
      const sync = async () => {
        try {
          setError(null);
          const data = await printfulService.fetchProducts();
          setProducts(data);
        } catch (err: any) {
          if (err.message === 'PRINTFUL_AUTH_FAILED') {
            setError('AUTH_FAILURE');
          } else if (err.message.includes('SERVER_MISCONFIG')) {
            setError('BRIDGE_FAILURE');
          } else {
            setError('SYNC_FAILURE');
          }
        } finally {
          setLoading(false);
        }
      };
      sync();
    } else {
      setProducts(initialProducts);
      setLoading(false);
    }
  }, [initialProducts]);

  const categories = ['All', 'Essentials', 'New Arrivals', 'Archive'];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.name.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]));

  if (loading) {
    return (
      <div className="pt-48 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-12 h-12 border-2 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin mb-8" />
        <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500">Establishing Bridge to Printful Archive...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter italic">Inventory</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mt-2">Browse the full Studios Stitch collection</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 border transition-all ${
                activeCategory === cat 
                  ? 'bg-white text-black border-white' 
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error === 'AUTH_FAILURE' ? (
        <div className="py-32 text-center border border-fuchsia-studio/30 bg-fuchsia-studio/5">
          <div className="mb-6">
            <span className="text-fuchsia-studio text-4xl font-black italic">! ! !</span>
          </div>
          <h2 className="text-white uppercase tracking-[0.2em] text-sm font-black">Authentication Protocol Failed</h2>
          <div className="mt-4 space-y-2 max-w-md mx-auto">
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] leading-loose">
              The provided <span className="text-white">PRINTFUL_TOKEN</span> was rejected by the server.<br/>
              1. Ensure the token in <span className="text-fuchsia-studio">.env</span> is a valid Personal Access Token.<br/>
              2. Verify your Printful Store is active.<br/>
              3. Restart your Node.js terminal to apply changes.
            </p>
          </div>
        </div>
      ) : error === 'BRIDGE_FAILURE' ? (
        <div className="py-32 text-center border border-yellow-500/30 bg-yellow-500/5">
          <div className="mb-6 text-yellow-500 text-4xl font-black italic">BRIDGE_OFFLINE</div>
          <h2 className="text-white uppercase tracking-[0.2em] text-sm font-black">Backend API Unreachable</h2>
          <p className="text-zinc-500 uppercase tracking-widest text-[10px] mt-4 max-w-md mx-auto">
            The frontend is receiving HTML instead of data. This usually happens if the backend server (port 3001) is not running.<br/><br/>
            Run <span className="text-white font-mono bg-zinc-800 px-2">npm start</span> in your terminal.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-32 text-center border border-zinc-900 bg-zinc-900/20">
          <div className="mb-6">
            <span className="text-fuchsia-studio text-4xl font-black italic">× × ×</span>
          </div>
          <p className="text-white uppercase tracking-[0.2em] text-sm font-black">Archive Manifest Empty</p>
          <p className="text-zinc-500 uppercase tracking-widest text-[10px] mt-2">Zero sync products detected in store.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 border border-zinc-800 px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            Force Sync Reboot
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-32 text-center">
          <p className="text-zinc-600 uppercase tracking-widest text-sm">No items found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 animate-in fade-in duration-700">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
