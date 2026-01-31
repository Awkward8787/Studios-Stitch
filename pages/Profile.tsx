
import React, { useState, useEffect } from 'react';
import { User, Product, Order } from '../types';
import { supabaseService } from '../services/supabaseService';
import { printfulService } from '../services/printfulService';
import ProductCard from '../components/ProductCard';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadManifest = async () => {
      setLoading(true);
      try {
        const [wishlist, userOrders] = await Promise.all([
          supabaseService.getWishlist(user.id),
          supabaseService.getUserOrders(user.id)
        ]);

        const productPromises = wishlist.map(item => printfulService.getProduct(item.product_id));
        const products = await Promise.all(productPromises);
        
        setWishlistProducts(products.filter((p): p is Product => p !== null));
        setOrders(userOrders);
      } catch (err) {
        console.error("MANIFEST_FETCH_ERROR", err);
      } finally {
        setLoading(false);
      }
    };
    loadManifest();
  }, [user.id]);

  if (loading) {
    return (
      <div className="pt-48 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-12 h-12 border-2 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin mb-8" />
        <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500">Decrypting User Manifest...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
        <div className="space-y-4">
           <div className="inline-block bg-fuchsia-studio px-2 py-1 text-[8px] font-black uppercase tracking-[0.4em] text-white mb-2">Security Level: Authorized</div>
           <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none italic">{user.email.split('@')[0]}</h1>
           <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-black">{user.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-right">
           <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Reserved Assets</p>
              <p className="text-3xl font-black text-white italic">{wishlistProducts.length}</p>
           </div>
           <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Access Role</p>
              <p className="text-3xl font-black text-fuchsia-studio italic">{user.role.toUpperCase()}</p>
           </div>
        </div>
      </div>

      <div className="space-y-16">
        <div className="flex items-center gap-6">
           <h2 className="text-2xl font-black uppercase tracking-tighter italic">Reserved Manifest</h2>
           <div className="h-[1px] flex-1 bg-zinc-900" />
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="py-32 text-center border border-zinc-900 bg-zinc-900/10">
            <span className="text-zinc-800 text-6xl font-black italic block mb-6">×</span>
            <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-black">Manifest Empty. No assets currently prioritized.</p>
            <a href="#/shop" className="inline-block mt-8 bg-white text-black px-12 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">Search Inventory</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Acquisition History */}
      <div className="mt-32 border-t border-zinc-900 pt-16 mb-24">
         <div className="flex items-center gap-6 mb-12">
           <h2 className="text-2xl font-black uppercase tracking-tighter italic">Acquisition History</h2>
           <div className="h-[1px] flex-1 bg-zinc-900" />
        </div>
        
        {orders.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-800">
             <p className="text-zinc-700 uppercase tracking-[0.4em] text-[9px] font-black">Global Log Interface: No completed transactions found for this identity.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-zinc-900/40 border border-zinc-800 p-6 flex flex-col md:flex-row justify-between items-center gap-6 stitch-corner">
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-4">
                    {order.items.slice(0, 3).map((item, i) => (
                      <img key={i} src={item.thumbnail_url} className="w-12 h-16 object-cover border-2 border-black rounded-sm" />
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-12 h-16 bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] font-black">+{order.items.length - 3}</div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Order Ref: {order.id.slice(0, 8)}</p>
                    <p className="text-xs font-black text-white uppercase mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-2 py-1 text-[8px] font-black uppercase rounded-sm border ${
                    order.status === 'completed' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 
                    order.status === 'pending' ? 'border-fuchsia-studio/20 text-fuchsia-studio bg-fuchsia-studio/5' : 'border-zinc-500/20 text-zinc-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                   <p className="text-xl font-black text-white italic">${order.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
