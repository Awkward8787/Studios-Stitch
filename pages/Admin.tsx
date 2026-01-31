
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

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  
  // Logic for Arbitrage View
  const arbitrageData = inventory.map(product => {
    const avgRetail = product.price;
    const avgCost = product.variants.reduce((sum, v) => sum + (v.cost || 0), 0) / (product.variants.length || 1);
    const margin = avgRetail - avgCost;
    const marginPercent = (margin / avgRetail) * 100;
    
    return {
      ...product,
      avgCost,
      margin,
      marginPercent
    };
  });

  const totalCosts = orders.reduce((sum, o) => {
    const orderCost = o.items.reduce((itemSum, item) => {
      const variant = item.variants.find(v => v.size === item.selectedSize);
      return itemSum + (variant?.cost || item.price * 0.6) * item.quantity;
    }, 0);
    return sum + orderCost;
  }, 0);

  const netProfit = totalRevenue - totalCosts;

  if (loading) return (
    <div className="pt-48 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-12 h-12 border-2 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin mb-8" />
      <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500">Decrypting Arbitrage Manifest...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Terminal Console</h1>
          <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">Logistics, Arbitrage & Distribution Protocol</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-sm">
          <button 
            onClick={() => setActiveView('orders')}
            className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 transition-all ${activeView === 'orders' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
          >
            Transactions
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

      {/* Dynamic Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 stitch-corner">
          <p className="text-zinc-500 text-[8px] uppercase font-black tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl font-black text-white">$ {totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 stitch-corner">
          <p className="text-zinc-500 text-[8px] uppercase font-black tracking-widest mb-1">Production Cost (Est)</p>
          <p className="text-2xl font-black text-zinc-400 italic">$ {totalCosts.toFixed(2)}</p>
        </div>
        <div className="bg-fuchsia-studio/10 border border-fuchsia-studio/30 p-6 stitch-corner">
          <p className="text-fuchsia-studio text-[8px] uppercase font-black tracking-widest mb-1">Net Profit / Arbitrage</p>
          <p className="text-2xl font-black text-fuchsia-studio">$ {netProfit.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 stitch-corner">
          <p className="text-zinc-500 text-[8px] uppercase font-black tracking-widest mb-1">Units Deployed</p>
          <p className="text-2xl font-black text-white">{orders.reduce((s, o) => s + o.items.length, 0)}</p>
        </div>
      </div>

      {activeView === 'orders' && (
        <div className="bg-zinc-950 border border-zinc-900 stitch-corner overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">
              <tr>
                <th className="px-6 py-5">Serial</th>
                <th className="px-6 py-5">Recipient</th>
                <th className="px-6 py-5">Arbitrage Gap</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Process</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-[10px] font-bold">
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-24 text-center text-zinc-700 italic">No transactions recorded in terminal.</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5 font-mono text-zinc-500">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-5 uppercase">{order.customer_email}</td>
                    <td className="px-6 py-5 text-green-500 font-mono">+$ {(order.total * 0.4).toFixed(2)}</td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 text-[8px] font-black uppercase border ${
                        order.status === 'completed' ? 'border-green-500/30 text-green-500' : 'border-fuchsia-studio/30 text-fuchsia-studio'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white">Push to Printful</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'inventory' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest">Manifest Health</h3>
              <button onClick={() => fetchData(true)} className="text-[9px] font-black uppercase tracking-widest border-b border-fuchsia-studio text-fuchsia-studio">Force Sync Reboot</button>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inventory.map(p => (
                <div key={p.id} className="bg-zinc-900/30 border border-zinc-800 p-4 flex items-center gap-6">
                  <img src={p.thumbnail_url} className="w-16 h-20 object-cover grayscale" alt="" />
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black uppercase text-white">{p.name}</h4>
                    <p className="text-[8px] font-mono text-zinc-600 mt-1">UUID: {p.id}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-[9px] font-black text-zinc-400">$ {p.price.toFixed(2)}</span>
                      <span className="text-[9px] font-black text-fuchsia-studio">IN STOCK</span>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeView === 'arbitrage' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 bg-zinc-900/80 border-l-4 border-fuchsia-studio">
            <h3 className="text-sm font-black uppercase tracking-widest mb-2">Arbitrage Insight Protocol</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-loose">
              Analyzing delta between <span className="text-white">Printful Production Cost</span> and <span className="text-white">Retail Deployment Value</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {arbitrageData.map(item => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-900 p-6 flex flex-col md:flex-row justify-between items-center gap-8 stitch-corner">
                <div className="flex items-center gap-6 w-full md:w-1/3">
                  <div className="w-12 h-16 bg-black border border-zinc-800 flex-shrink-0">
                    <img src={item.thumbnail_url} className="w-full h-full object-cover grayscale" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white truncate max-w-[200px]">{item.name}</h4>
                    <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest mt-1">{item.variants.length} SKU ITERATIONS</p>
                  </div>
                </div>

                <div className="flex gap-12 w-full md:w-2/3 justify-end items-center">
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Production</p>
                    <p className="text-sm font-mono text-zinc-400">$ {item.avgCost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">Retail</p>
                    <p className="text-sm font-mono text-white">$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right w-24">
                    <p className="text-[8px] text-fuchsia-studio uppercase font-black tracking-widest mb-1">Margin %</p>
                    <div className="flex items-center justify-end gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.marginPercent > 40 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <p className="text-lg font-black text-fuchsia-studio italic">{item.marginPercent.toFixed(0)}%</p>
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
