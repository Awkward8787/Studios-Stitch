
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="relative group">
      <Link 
        to={`/product/${product.id}`} 
        className="block bg-white stitch-corner transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_50px_rgba(192,0,90,0.1)]"
      >
        <div className="aspect-[3/4] overflow-hidden relative p-1 bg-black">
          <img 
            src={product.thumbnail_url} 
            alt={product.name} 
            className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
          />
          {/* Fuchsia Accent on Hover */}
          <div className="absolute inset-0 bg-fuchsia-studio opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
          
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