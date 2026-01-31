
import React, { useState, useEffect } from 'react';
import { Order, Product } from '../types';
import { supabaseService } from '../services/supabaseService';
import { printfulService } from '../services/printfulService';

const Admin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeView, setActiveView] = useState<'orders' | 'inventory' | 'arbitrage'>('orders');

  const fetchData = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true);
    else setLoading(true);
    
    try {
      const [orderData, productData] = await Promise.all([
        supabaseService.getOrders(),
        printfulService.fetchProducts()
      ]);
      setOrders(orderData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setInventory(productData);
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

  // --- ARBITRAGE CALCULATIONS ---
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  
  const totalCosts = orders.reduce((sum, o) => {
    const orderCost = o.items.reduce((itemSum, item) => {
      // Find the specific variant cost from our enriched product data
      const prod = inventory.find(p => p.id === item.id);
      const variant = prod?.variants.find(v => v.size === item.selectedSize);
      return itemSum + (variant?.cost || item.price * 0.6) * item.quantity;
    }, 0);
    return sum + orderCost;
  }, 0);

  const netProfit = totalRevenue - totalCosts;

  const arbitrageInsights = inventory.map(product => {
    const avgRetail = product.price;
    const avgCost = product.variants.reduce((sum, v) => sum + v.cost, 0) / (product.variants.length || 1);
    const margin = avgRetail - avgCost;
    const marginPercent = (margin / avgRetail) * 100;
    
    return {
      ...product,
      avgCost,
      margin,
      marginPercent
    };
  });

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
        <div className="flex bg-zinc-900 p-1 border border-zinc-800">
          <button 
            onClick={() => setActiveView('orders')}
            className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 transition-all ${activeView === 'orders' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveView('inventory')}
            className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 transition-all ${activeView === 'inventory' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Archive
          </button>
          <button 
            onClick={() => setActiveView('arbitrage')}
            className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 transition-all ${activeView === 'arbitrage' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Arbitrage
          </button>
        </div>
      </div>

      {/* Global Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 font-mono">
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 stitch-corner">
          <p className="text-zinc-600 text-[8px] uppercase font-black mb-1">GROSS_REVENUE</p>
          <p className="text-2xl font-black text-white">$ {totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 stitch-corner">
          <p className="text-zinc-600 text-[8px] uppercase font-black mb-1">COGS_ESTIMATE</p>
          <p className="text-2xl font-black text-zinc-500">$ {totalCosts.toFixed(2)}</p>
        </div>
        <div className="bg-fuchsia-studio/5 border border-fuchsia-studio/20 p-6 stitch-corner">
          <p className="text-fuchsia-studio text-[8px] uppercase font-black mb-1">NET_ARBITRAGE</p>
          <p className="text-2xl font-black text-fuchsia-studio">$ {netProfit.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 stitch-corner">
          <p className="text-zinc-600 text-[8px] uppercase font-black mb-1">MARGIN_EFFICIENCY</p>
          <p className="text-2xl font-black text-white">{totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
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

      {activeView === 'inventory' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Archive Manifest Health</h3>
              <button 
                onClick={() => fetchData(true)} 
                disabled={syncing}
                className="text-[9px] font-black uppercase tracking-widest border border-zinc-800 px-4 py-2 hover:border-fuchsia-studio text-fuchsia-studio disabled:opacity-50"
              >
                {syncing ? 'SYNC_IN_PROGRESS...' : 'FORCE_ARCHIVE_REBOOT'}
              </button>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {inventory.map(p => (
                <div key={p.id} className="bg-zinc-900/30 border border-zinc-800 p-5 flex items-center gap-6 stitch-corner group">
                  <div className="w-16 h-20 bg-black overflow-hidden border border-zinc-800 flex-shrink-0">
                    <img src={p.thumbnail_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-[11px] font-black uppercase text-white truncate">{p.name}</h4>
                    <p className="text-[8px] font-mono text-zinc-600 mt-1 uppercase">SYNC_ID: {p.id}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-[9px] font-black text-zinc-400">$ {p.price.toFixed(2)}</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-green-500" />
                        <span className="text-[8px] font-black text-zinc-500 uppercase">ACTIVE</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeView === 'arbitrage' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 bg-zinc-900/80 border-l-4 border-fuchsia-studio mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-3">
              <span className="animate-pulse">●</span> Arbitrage Insight Engine (v2)
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-loose">
              LIVE_FEED: Comparing <span className="text-white">Printful Production Cost</span> vs <span className="text-white">Retail Deployment Value</span>.
            </p>
          </div>

          <div className="space-y-4">
            {arbitrageInsights.map(item => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-900 p-6 flex flex-col md:flex-row justify-between items-center gap-12 stitch-corner hover:border-fuchsia-studio/40 transition-colors">
                <div className="flex items-center gap-6 w-full md:w-1/3">
                  <div className="w-12 h-16 bg-black border border-zinc-800 flex-shrink-0">
                    <img src={item.thumbnail_url} className="w-full h-full object-cover grayscale" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black uppercase text-white truncate">{item.name}</h4>
                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                      {item.variants.length} SKU_ITERATIONS
                    </p>
                  </div>
                </div>

                <div className="flex gap-16 w-full md:w-2/3 justify-end items-center font-mono">
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">PROD_COST</p>
                    <p className="text-sm font-black text-zinc-500">$ {item.avgCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">RETAIL_VALUE</p>
                    <p className="text-sm font-black text-white">$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-[8px] text-fuchsia-studio uppercase font-black tracking-widest mb-1">NET_GAP</p>
                    <div className="flex items-center justify-end gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.marginPercent > 35 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                      <p className="text-xl font-black text-fuchsia-studio italic">{item.marginPercent.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
