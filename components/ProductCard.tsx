
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, size: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group bg-black border border-zinc-900 hover:border-fuchsia-studio/50 transition-all rounded-sm">
      <Link to={`/product/${product.id}`} className="block relative">
        <div className="aspect-[4/5] bg-zinc-950 overflow-hidden relative">
          {imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 uppercase font-black text-[8px] tracking-widest">Asset_Missing</div>
          ) : (
            <img 
              src={product.thumbnail_url} 
              alt={product.name} 
              onError={() => setImageError(true)}
              className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
            />
          )}
          
          {/* Badge */}
          <div className="absolute top-3 left-3 bg-fuchsia-studio text-white text-[8px] font-black px-2 py-1 uppercase tracking-widest">New</div>
          
          {/* Action Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black to-transparent">
             <button 
               onClick={(e) => {
                 e.preventDefault();
                 if (onAddToCart && product.variants.length > 0) onAddToCart(product, product.variants[0].size);
               }}
               className="w-full bg-white text-black py-3 font-black uppercase text-[9px] tracking-[0.2em] hover:bg-fuchsia-studio hover:text-white transition-all shadow-xl"
             >
               Quick Add +
             </button>
          </div>
        </div>
      </Link>
      
      <div className="p-5 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <Link to={`/product/${product.id}`} className="text-[11px] font-black uppercase tracking-tight text-white hover:text-fuchsia-studio transition-colors line-clamp-1">
            {product.name}
          </Link>
        </div>
        
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className="text-[10px] text-fuchsia-studio">★</span>
          ))}
          <span className="text-[8px] text-zinc-600 font-black ml-1 uppercase">(24 Reviews)</span>
        </div>

        <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900">
          <p className="text-xs font-black text-zinc-300">$ {product.price.toFixed(2)}</p>
          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Artist Original</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
