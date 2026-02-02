
import React, { useState, useEffect } from 'react';
import { Product, Review, User } from '../types';
import { printfulService } from '../services/printfulService';
import { supabaseService } from '../services/supabaseService';

interface ProductDetailProps {
  productId: string;
  onAddToCart: (product: Product, size: string) => void;
  currentUser: User | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onAddToCart, currentUser }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [mainImage, setMainImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [data, revs] = await Promise.all([
        printfulService.getProduct(productId),
        supabaseService.getReviews(productId)
      ]);
      
      if (data) {
        setProduct(data);
        setSelectedSize(data.variants[0].size);
        setMainImage(data.thumbnail_url);
      }
      setReviews(revs);

      if (currentUser) {
        const wishlist = await supabaseService.getWishlist(currentUser.id);
        setIsWishlisted(wishlist.some(item => item.productId === productId));
      }
      
      setLoading(false);
    };
    load();
  }, [productId, currentUser]);

  const handleToggleWishlist = async () => {
    if (!currentUser) {
      alert("AUTHENTICATION_REQUIRED: Bridge not established.");
      return;
    }
    const added = await supabaseService.toggleWishlist(currentUser.id, productId);
    setIsWishlisted(added);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    try {
      const newReview = await supabaseService.addReview({
        product_id: productId,
        user_id: currentUser.id,
        user_email: currentUser.email,
        rating,
        comment
      });
      setReviews(prev => [newReview, ...prev]);
      setComment('');
    } catch (err) {
      alert("REPORT_FAILURE: Submission corrupted.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const galleryImages = product.images.filter(img => img !== mainImage).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Gallery */}
        <div className="space-y-6">
          <div className="aspect-[3/4] bg-white stitch-corner p-2 overflow-hidden shadow-2xl">
            <div className="w-full h-full bg-black overflow-hidden relative group">
               <div className="w-full h-full flex items-center justify-center">
                 <img src={mainImage} loading="eager" className="w-full h-full object-contain grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={product.name} />
              </div>
            </div>
          </div>
          
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-6">
              {galleryImages.map((img, i) => (
                <button key={i} onClick={() => setMainImage(img)} className={`aspect-[3/4] bg-white p-1 stitch-corner transition-all cursor-crosshair group overflow-hidden ${mainImage === img ? 'border-2 border-fuchsia-studio' : 'grayscale hover:grayscale-0'}`}>
                  <div className="w-full h-full bg-black relative flex items-center justify-center">
                    <img src={img} className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" alt={`${product.name} angle ${i}`} />
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
              <span className="text-fuchsia-studio text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em]">Inventory Unit {product.id.slice(0, 8)}</span>
              <div className="h-[1px] flex-1 bg-zinc-900" />
            </div>
            <div className="flex justify-between items-start gap-6">
              <h1 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none italic break-words">{product.name}</h1>
              <button 
                onClick={handleToggleWishlist}
                className={`p-4 border transition-all flex-shrink-0 ${isWishlisted ? 'bg-fuchsia-studio border-fuchsia-studio text-white' : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-white'}`}
                title={isWishlisted ? "Remove from Manifest" : "Reserve to Manifest"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8">
              <p className="text-3xl md:text-4xl font-black text-white">$ {product.price.toFixed(2)}</p>
              <span className="text-zinc-600 text-[10px] md:text-xs font-bold uppercase tracking-widest border-l border-zinc-800 pl-6">Retail Grade</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.variants.map((v) => (
                <button key={v.id} onClick={() => setSelectedSize(v.size)} className={`py-4 text-[10px] md:text-[11px] font-black uppercase transition-all relative ${selectedSize === v.size ? 'bg-fuchsia-studio text-white' : 'bg-black border border-zinc-800 text-zinc-500 hover:border-zinc-500 hover:text-white'}`}>
                  {v.size}
                  {selectedSize === v.size && <div className="absolute -top-1 -left-1 text-white text-[8px] font-black">×</div>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <button onClick={() => onAddToCart(product, selectedSize)} className="group relative w-full bg-white text-black py-6 md:py-7 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs hover:bg-fuchsia-studio hover:text-white transition-all overflow-hidden">
              <span className="relative z-10">Add to Archive</span>
              <div className="absolute top-0 left-0 w-full h-full bg-fuchsia-studio translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            </button>
            <div className="p-6 border-l-2 border-fuchsia-studio bg-zinc-900/40 backdrop-blur-sm">
              <p className="text-zinc-400 text-[10px] md:text-xs leading-relaxed uppercase tracking-[0.2em] font-medium break-words">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-24 md:mt-32 border-t border-zinc-900 pt-16 md:pt-24 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Diagnostic Log</h2>
            <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-[0.4em] mt-2 font-bold break-words">Field Deployment Reports from Authorized Users</p>
          </div>
          <div className="text-right">
             <span className="text-fuchsia-studio text-[10px] md:text-xs font-black italic">{reviews.length} REPORTS FOUND</span>
          </div>
        </div>

        {/* Submission Form */}
        {currentUser ? (
          <form onSubmit={handleReviewSubmit} className="mb-24 bg-zinc-900/30 p-8 border border-zinc-800 stitch-corner">
            <div className="flex justify-between items-center mb-6">
               <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Add Field Report</span>
               <div className="flex gap-2">
                 {[1, 2, 3, 4, 5].map(star => (
                   <button 
                    key={star} 
                    type="button" 
                    onClick={() => setRating(star)}
                    className={`text-xl font-black italic transition-colors ${rating >= star ? 'text-fuchsia-studio' : 'text-zinc-800'}`}
                   >
                     ×
                   </button>
                 ))}
               </div>
            </div>
            <textarea 
              className="w-full bg-black border border-zinc-800 p-6 text-[11px] font-mono text-white placeholder:text-zinc-800 outline-none focus:border-fuchsia-studio transition-colors resize-none"
              rows={4}
              placeholder="ENTER FIELD NOTES..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
            />
            <button 
              disabled={submitting}
              className="mt-6 bg-white text-black px-12 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all disabled:opacity-50 w-full md:w-auto"
            >
              {submitting ? 'SYNCING...' : 'PUBLISH REPORT'}
            </button>
          </form>
        ) : (
          <div className="mb-24 p-12 text-center border border-zinc-900 bg-zinc-900/20">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-600">Secure Authentication Required to Leave Field Notes.</p>
            <a href="#/auth" className="inline-block mt-4 text-fuchsia-studio text-[10px] font-black uppercase tracking-widest border-b border-fuchsia-studio">Verify Identity</a>
          </div>
        )}

        {/* Review List */}
        <div className="space-y-12">
          {reviews.length === 0 ? (
            <p className="text-center py-12 text-zinc-700 uppercase tracking-[0.3em] font-black italic">Manifest Zero: No reports logged for this unit.</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="group relative border-b border-zinc-900 pb-12 last:border-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">{review.user_email.split('@')[0]}</span>
                    <p className="text-[8px] text-zinc-700 uppercase tracking-widest">{new Date(review.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({length: 5}).map((_, i) => (
                      <span key={i} className={`text-lg font-black italic ${i < review.rating ? 'text-fuchsia-studio' : 'text-zinc-900'}`}>×</span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-[0.15em] leading-relaxed font-mono break-words">
                   {review.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
