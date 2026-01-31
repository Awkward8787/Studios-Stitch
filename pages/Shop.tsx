
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

      {filteredProducts.length === 0 ? (
        <div className="py-32 text-center">
          <p className="text-zinc-600 uppercase tracking-widest text-sm">No items found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
