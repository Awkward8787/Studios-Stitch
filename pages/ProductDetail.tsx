
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { printfulService } from '../services/printfulService';

interface ProductDetailProps {
  productId: string;
  onAddToCart: (product: Product, size: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onAddToCart }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [mainImage, setMainImage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await printfulService.getProduct(productId);
      if (data) {
        setProduct(data);
        setSelectedSize(data.variants[0].size);
        // Default to the prioritized ghost model image
        setMainImage(data.thumbnail_url);
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-black uppercase tracking-tighter">Object Lost</h1>
      <a href="#/shop" className="text-fuchsia-studio uppercase text-[10px] font-black tracking-[0.3em] hover:text-white transition-colors">Re-Enter Inventory</a>
    </div>
  );

  // Strictly filter for product-only images (avoiding any URLs that might be lifestyle placeholders)
  // We prioritize high-res preview mockups from the Printful variant files
  const galleryImages = product.images.filter(img => img !== mainImage).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        {/* Gallery */}
        <div className="space-y-6">
          <div className="aspect-[3/4] bg-white stitch-corner p-2 overflow-hidden shadow-2xl perspective-1000">
            <div className="w-full h-full bg-black overflow-hidden relative group preserve-3d">
               {/* Ghost 3D Model Container with Animation */}
               <div className="w-full h-full flex items-center justify-center transform transition-all duration-700 animate-[bounce_5s_infinite_ease-in-out] group-hover:ghost-spin-active">
                 <img 
                  src={mainImage} 
                  loading="eager"
                  className="w-full h-full object-contain grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110" 
                  alt={product.name}
                />
              </div>
              
              {/* Overlay Tags */}
              <div className="absolute top-4 right-4 bg-fuchsia-studio text-white text-[8px] font-black px-2 py-1 tracking-widest uppercase">
                3D GHOST MOCKUP
              </div>
              <div className="absolute bottom-4 left-4 bg-white text-black px-3 py-1 text-[9px] font-black uppercase">Technical Profile</div>
              
              {/* Internal Stitch Marks */}
              <div className="absolute top-8 left-8 text-white/20 text-xs font-black">×</div>
              <div className="absolute bottom-8 right-8 text-white/20 text-xs font-black">×</div>
            </div>
          </div>
          
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-6">
              {galleryImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setMainImage(img)}
                  className={`aspect-[3/4] bg-white p-1 stitch-corner transition-all cursor-crosshair group overflow-hidden ${mainImage === img ? 'border-2 border-fuchsia-studio' : 'grayscale hover:grayscale-0'}`}
                >
                  <div className="w-full h-full bg-black relative flex items-center justify-center">
                    <img 
                      src={img} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                      alt={`${product.name} angle ${i}`}
                    />
                    <div className="absolute inset-0 bg-fuchsia-studio/0 group-hover:bg-fuchsia-studio/10 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-32 space-y-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-fuchsia-studio text-[10px] font-black uppercase tracking-[0.5em]">Inventory Unit {product.id.slice(0, 8)}</span>
              <div className="h-[1px] flex-1 bg-zinc-900" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none italic drop-shadow-sm">{product.name}</h1>
            <div className="flex items-center gap-6 mt-8">
              <p className="text-4xl font-black text-white">$ {product.price.toFixed(2)}</p>
              <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest border-l border-zinc-800 pl-6">Retail Grade</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">Dimensions / Sizing</span>
              <button className="text-[9px] font-black uppercase text-fuchsia-studio hover:text-white transition-colors tracking-widest">View Guide</button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedSize(v.size)}
                  className={`py-4 text-[11px] font-black uppercase transition-all relative ${
                    selectedSize === v.size 
                      ? 'bg-fuchsia-studio text-white' 
                      : 'bg-black border border-zinc-800 text-zinc-500 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  {v.size}
                  {selectedSize === v.size && <div className="absolute -top-1 -left-1 text-white text-[8px] font-black">×</div>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <button 
              onClick={() => onAddToCart(product, selectedSize)}
              className="group relative w-full bg-white text-black py-7 font-black uppercase tracking-[0.4em] text-xs hover:bg-fuchsia-studio hover:text-white transition-all overflow-hidden"
            >
              <span className="relative z-10">Add to Archive</span>
              <div className="absolute top-0 left-0 w-full h-full bg-fuchsia-studio translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            </button>
            <div className="p-6 border-l-2 border-fuchsia-studio bg-zinc-900/40 backdrop-blur-sm">
              <p className="text-zinc-400 text-xs leading-relaxed uppercase tracking-[0.2em] font-medium">
                {product.description}
              </p>
            </div>
          </div>

          {/* Industrial Specs */}
          <div className="grid grid-cols-1 gap-8 pt-8 border-t border-zinc-900">
             <div className="flex gap-6 items-start">
                <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-fuchsia-studio font-black text-xl italic">×</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Advanced Construction</h4>
                  <p className="text-[10px] text-zinc-600 uppercase mt-1 leading-relaxed">High-density textile assembly featuring reinforced cross-stitching.</p>
                </div>
             </div>
             <div className="flex gap-6 items-start">
                <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-fuchsia-studio font-black text-xl italic">×</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Ghost Manifest</h4>
                  <p className="text-[10px] text-zinc-600 uppercase mt-1 leading-relaxed">Each piece is archived through the studio terminal for authenticity.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
