
import React, { useState, useEffect } from 'react';
import { Order, Product, CommunityAsset } from '../types';
import { supabaseService } from '../services/supabaseService';
import { printfulService } from '../services/printfulService';

const Admin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [assets, setAssets] = useState<CommunityAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeView, setActiveView] = useState<'orders' | 'inventory' | 'arbitrage' | 'assets'>('orders');

  const fetchData = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true);
    else setLoading(true);
    
    try {
      const [orderData, productData, assetData] = await Promise.all([
        supabaseService.getOrders(),
        printfulService.fetchProducts(),
        supabaseService.getAssets(false)
      ]);
      setOrders(orderData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setInventory(productData);
      setAssets(assetData);
    } catch (err) {
      console.error("ADMIN_FETCH_ERROR", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    await supabaseService.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Confirm Asset Deletion? This cannot be undone.")) return;
    await supabaseService.deleteAsset(id);
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCosts = orders.reduce((sum, o) => {
    const orderCost = o.items.reduce((itemSum, item) => {
      const prod = inventory.find(p => p.id === item.id);
      const variant = prod?.variants.find(v => v.size === item.selectedSize);
      return itemSum + (variant?.cost || item.price * 0.6) * item.quantity;
    }, 0);
    return sum + orderCost;
  }, 0);

  const netProfit = totalRevenue - totalCosts;

  if (loading) return (
    <div className="pt-48 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-12 h-12 border-2 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin mb-8" />
      <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500">Decrypting Arbitrage Manifest (API_V2)...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Terminal Console</h1>
          <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">Logistics & Arbitrage Protocol v2.4.0</p>
        </div>
        <div className="flex bg-zinc-900 p-1 border border-zinc-800 overflow-x-auto max-w-full">
          {['orders', 'inventory', 'assets', 'arbitrage'].map((view) => (
            <button 
              key={view}
              onClick={() => setActiveView(view as any)}
              className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 transition-all whitespace-nowrap ${activeView === view ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'orders' && (
        <div className="bg-zinc-950 border border-zinc-900 stitch-corner overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/80 text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">
              <tr>
                <th className="px-6 py-5">Serial_ID</th>
                <th className="px-6 py-5">Recipient_Node</th>
                <th className="px-6 py-5">Value_Flux</th>
                <th className="px-6 py-5">Logistics_Status</th>
                <th className="px-6 py-5 text-right">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-[10px] font-bold">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 font-mono text-zinc-500">{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-5 uppercase truncate max-w-[150px]">{order.customer_email}</td>
                  <td className="px-6 py-5 font-mono text-white">$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 text-[8px] font-black uppercase border ${
                      order.status === 'completed' ? 'border-green-500/30 text-green-500' : 'border-fuchsia-studio/30 text-fuchsia-studio'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                     <button className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white group-hover:text-fuchsia-studio transition-colors">PUSH_FULFILLMENT</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map(asset => (
            <div key={asset.id} className="bg-zinc-900/30 border border-zinc-800 p-4 stitch-corner group">
              <div className="aspect-[4/5] bg-black mb-4 overflow-hidden">
                <img src={asset.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
              </div>
              <h4 className="text-[10px] font-black uppercase text-white truncate">{asset.title}</h4>
              <p className="text-[8px] text-zinc-600 uppercase mt-1">Artist: {asset.artist_name}</p>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between">
                <span className="text-[8px] font-black text-fuchsia-studio uppercase tracking-widest">{asset.status}</span>
                <button 
                  onClick={() => handleDeleteAsset(asset.id)}
                  className="text-[8px] font-black text-zinc-500 hover:text-white uppercase tracking-widest"
                >
                  Terminate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other views remain unchanged */}
    </div>
  );
};

export default Admin;