
import React, { useState, useEffect } from 'react';
import { Order, Product } from '../types';
import { supabaseService } from '../services/supabaseService';
import { printfulService } from '../services/printfulService';

const Admin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeView, setActiveView] = useState<'orders' | 'inventory'>('orders');

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

  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    activeInventory: inventory.length
  };

  if (loading) return (
    <div className="pt-48 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-12 h-12 border-2 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin mb-8" />
      <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500">Accessing Admin Data Manifest...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Terminal Console</h1>
          <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">Global Infrastructure & Logistics Control</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveView('orders')}
            className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 border transition-all ${activeView === 'orders' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}
          >
            Orders History
          </button>
          <button 
            onClick={() => setActiveView('inventory')}
            className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 border transition-all ${activeView === 'inventory' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}
          >
            Inventory Health
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 stitch-corner relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
             <span className="text-4xl font-black italic">×</span>
          </div>
          <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-2">Total Gross Revenue</p>
          <p className="text-3xl font-black text-white">$ {stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 stitch-corner relative overflow-hidden group">
          <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-2">Transaction Volume</p>
          <p className="text-3xl font-black text-white">{stats.totalOrders} Units</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 stitch-corner relative overflow-hidden group">
          <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-2">Live Inventory Count</p>
          <p className="text-3xl font-black text-fuchsia-studio italic">{stats.activeInventory} Objects</p>
        </div>
      </div>

      {activeView === 'orders' ? (
        <div className="bg-zinc-950 border border-zinc-900 overflow-x-auto stitch-corner">
          <table className="w-full text-left">
            <thead className="bg-zinc-900 text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black border-b border-zinc-800">
              <tr>
                <th className="px-6 py-5">Serial ID</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Assets</th>
                <th className="px-6 py-5">Value</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-[10px] font-bold">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center text-zinc-700 uppercase tracking-[0.4em] italic">Log Interface Zero: No transactions recorded.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-5 font-mono text-zinc-500">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-5 uppercase tracking-wider">{order.customer_email}</td>
                    <td className="px-6 py-5">
                      <div className="flex -space-x-2">
                         {order.items.map((item, i) => (
                           <img key={i} src={item.thumbnail_url} className="w-8 h-10 object-cover border border-black grayscale hover:grayscale-0 transition-all" alt="" />
                         ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-white">$ {order.total.toFixed(2)}</td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 text-[8px] font-black uppercase border ${
                        order.status === 'completed' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
                        order.status === 'pending' ? 'border-fuchsia-studio/30 text-fuchsia-studio bg-fuchsia-studio/5' : 'border-zinc-700 text-zinc-500'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <select 
                        className="bg-black border border-zinc-800 text-[8px] uppercase font-black px-3 py-1 outline-none focus:border-fuchsia-studio"
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="shipped">Shipped</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-zinc-900/30 p-4 border border-zinc-800 mb-6">
              <div className="flex items-center gap-4">
                 <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-fuchsia-studio animate-pulse' : 'bg-green-500'}`} />
                 <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    {syncing ? 'RE-INITIALIZING ARCHIVE SYNC...' : 'ARCHIVE CONNECTION ESTABLISHED'}
                 </p>
              </div>
              <button 
                onClick={() => fetchData(true)}
                disabled={syncing}
                className="bg-white text-black px-6 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all disabled:opacity-50"
              >
                {syncing ? 'SYNCING...' : 'FORCE ARCHIVE REBOOT'}
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {inventory.length === 0 ? (
                <div className="lg:col-span-2 py-32 text-center border border-zinc-900 bg-zinc-950 stitch-corner">
                  <span className="text-4xl text-zinc-800 font-black mb-6 block italic">× × ×</span>
                  <div className="max-w-md mx-auto space-y-6">
                    <h3 className="text-white uppercase tracking-[0.2em] text-sm font-black italic">Archive manifest is empty.</h3>
                    <p className="text-zinc-600 uppercase tracking-widest text-[9px] leading-loose font-bold">
                      If you just changed your API Token, ensure you have <span className="text-white">RESTARTED THE BACKEND SERVER</span>. <br/>
                      Also, ensure you have created <span className="text-fuchsia-studio">"Sync Products"</span> in your Printful dashboard (not just items in your library).
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                      <a href="https://www.printful.com/dashboard/products" target="_blank" className="bg-white text-black px-10 py-4 text-[9px] font-black uppercase tracking-widest hover:bg-fuchsia-studio hover:text-white transition-all">
                        Open Printful Dash
                      </a>
                      <button onClick={() => fetchData(true)} className="border border-zinc-800 px-10 py-4 text-[9px] font-black uppercase tracking-widest hover:border-white transition-all">
                        Retry Sync Bridge
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                inventory.map(product => (
                  <div key={product.id} className="bg-zinc-950 border border-zinc-800 p-6 flex gap-6 items-center stitch-corner hover:border-fuchsia-studio transition-colors group">
                    <div className="w-20 h-24 bg-black overflow-hidden border border-zinc-800">
                      <img src={product.thumbnail_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="flex justify-between items-start">
                          <h3 className="text-xs font-black uppercase tracking-tight text-white">{product.name}</h3>
                          <span className="text-[8px] font-mono text-zinc-600">UID: {product.id}</span>
                       </div>
                       <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{product.variants.length} SKU VARIANTS DETECTED</p>
                       <div className="flex gap-4 items-center pt-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">SYNC_ACTIVE</span>
                       </div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
