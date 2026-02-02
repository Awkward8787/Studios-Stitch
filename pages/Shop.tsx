
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { printfulService } from '../services/printfulService';
import { Link } from 'react-router-dom';

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
        <div className="border-l-4 border-fuchsia-studio pl-8">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter italic break-words">Archive Manifest</h1>
          <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] mt-2 font-bold">Authenticated Inventory Units // Series 01</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[9px] uppercase font-black tracking-widest px-5 py-3 border transition-all ${
                activeCategory === cat 
                  ? 'bg-white text-black border-white' 
                  : 'border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error === 'AUTH_FAILURE' ? (
        <div className="py-32 text-center border border-fuchsia-studio/30 bg-fuchsia-studio/5 stitch-corner">
          <div className="mb-6">
            <span className="text-fuchsia-studio text-4xl font-black italic">! ! !</span>
          </div>
          <h2 className="text-white uppercase tracking-[0.2em] text-sm font-black">Authentication Protocol Failed</h2>
          <div className="mt-4 space-y-4 max-w-md mx-auto">
            <p className="text-zinc-500 uppercase tracking-widest text-[10px] leading-loose">
              The bridge cannot verify your <span className="text-white">PRINTFUL_TOKEN</span>. Ensure it is a valid Personal Access Token with <span className="text-white">"Store Information"</span> scopes enabled.
            </p>
            <Link to="/setup" className="inline-block border border-fuchsia-studio px-8 py-3 text-[10px] font-black uppercase tracking-widest text-fuchsia-studio hover:bg-fuchsia-studio hover:text-white transition-all">
              Reconfigure Bridge
            </Link>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="py-32 text-center border border-zinc-900 bg-zinc-900/10 stitch-corner">
          <div className="mb-12">
            <span className="text-zinc-800 text-[12rem] font-black italic leading-none opacity-20">000</span>
          </div>
          <p className="text-white uppercase tracking-[0.3em] text-sm font-black italic">Archive manifest is empty.</p>
          <div className="mt-8 space-y-6 max-w-lg mx-auto">
            <p className="text-zinc-600 uppercase tracking-widest text-[9px] leading-loose font-bold">
              Diagnostic: Bridge connected, but zero "Sync Products" detected. <br/>
              Note: Items must be designed and synced to your store in Printful before they appear here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
               <a href="https://www.printful.com/dashboard/products" target="_blank" className="bg-white text-black px-10 py-4 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">
                  Open Printful Dash
               </a>
               <button onClick={() => window.location.reload()} className="border border-zinc-800 px-10 py-4 text-[9px] font-black uppercase tracking-widest hover:border-white transition-all">
                  Force Sync Reboot
               </button>
            </div>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-32 text-center">
          <p className="text-zinc-600 uppercase tracking-[0.4em] text-[10px] font-black italic">No objects match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 animate-in fade-in duration-1000">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
