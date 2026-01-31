
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, size: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart && product.variants.length > 0) {
      // Add the first available variant (default)
      onAddToCart(product, product.variants[0].size);
    }
  };

  return (
    <div className="relative group perspective-1000">
      <Link 
        to={`/product/${product.id}`} 
        className="block bg-white stitch-corner transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(192,0,90,0.1)]"
      >
        <div className="aspect-[3/4] overflow-hidden relative p-1 bg-black preserve-3d">
          <div className="w-full h-full transition-transform duration-1000 group-hover:ghost-spin-active">
            <img 
              src={product.thumbnail_url} 
              alt={product.name} 
              className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
            />
          </div>
          
          {/* Fuchsia Accent on Hover */}
          <div className="absolute inset-0 bg-fuchsia-studio opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
          
          {/* Quick Add Button */}
          {onAddToCart && (
            <button 
              onClick={handleQuickAdd}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-fuchsia-studio text-white p-3 rounded-full shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 z-30"
              title="Quick Add to Bag"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/><line x1="12" y1="13" x2="12" y2="19"/><line x1="9" y1="16" x2="15" y2="16"/>
              </svg>
            </button>
          )}

          {/* Internal Wound Stitches */}
          <div className="absolute top-4 left-4 text-white text-[12px] font-black opacity-0 group-hover:opacity-100 transition-all duration-500">×</div>
          <div className="absolute bottom-4 right-4 text-white text-[12px] font-black opacity-0 group-hover:opacity-100 transition-all duration-500">×</div>
          
          {/* Label Tag */}
          <div className="absolute top-4 right-4 bg-fuchsia-studio text-white text-[8px] font-black px-2 py-1 transform rotate-90 origin-right tracking-widest">
            S.STITCH // ARC01
          </div>
        </div>
        
        <div className="p-6 bg-white border-t border-zinc-100 flex flex-col gap-2">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-black text-xs font-black tracking-tighter uppercase leading-tight flex-1">{product.name}</h3>
            <span className="text-fuchsia-studio font-black italic text-xs">×</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">$ {product.price.toFixed(2)}</p>
            <div className="overflow-hidden">
               <span className="text-black text-[9px] font-black uppercase tracking-widest transform translate-y-full group-hover:translate-y-0 transition-transform block">
                 Deploy Object
               </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
