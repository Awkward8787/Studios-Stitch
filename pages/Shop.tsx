
import React, { useState } from 'react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface ShopProps {
  products: Product[];
  onAddToCart: (product: Product, size: string) => void;
}

const Shop: React.FC<ShopProps> = ({ products, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Essentials', 'New Arrivals', 'Archive'];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.name.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0]));

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Inventory</h1>
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

      {products.length === 0 ? (
        <div className="py-32 text-center border border-zinc-900 bg-zinc-900/20">
          <div className="mb-6">
            <span className="text-fuchsia-studio text-4xl font-black italic">× × ×</span>
          </div>
          <p className="text-white uppercase tracking-[0.2em] text-sm font-black">No items retrieved from Archive</p>
          <div className="mt-4 space-y-2 max-w-md mx-auto">
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] leading-loose">
              1. Ensure products are "Synced" in your Printful Dashboard.<br/>
              2. Verify PRINTFUL_TOKEN in Hostinger Env Variables.<br/>
              3. Check browser console for STITCH_TERMINAL errors.
            </p>
          </div>
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
