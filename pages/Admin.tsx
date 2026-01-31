
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { supabaseService } from '../services/supabaseService';

const Admin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await supabaseService.getOrders();
      setOrders(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    await supabaseService.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length
  };

  if (loading) return <div className="p-12 text-center text-zinc-500">Loading Dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pt-24">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter italic">Terminal</h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">Global Order & Logistics Center</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900 border border-zinc-800 p-8 stitch-corner">
          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">Total Gross</p>
          <p className="text-3xl font-black">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 stitch-corner">
          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">Total Volume</p>
          <p className="text-3xl font-black">{stats.totalOrders} Units</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 stitch-corner">
          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">Active Pipeline</p>
          <p className="text-3xl font-black text-fuchsia-studio">{stats.pendingOrders} Orders</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50 text-xs uppercase tracking-widest text-zinc-400 font-black border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Serial ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Assets</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 uppercase tracking-widest italic font-bold">Database Clean: No Orders Found</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-xs">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-black text-xs uppercase">{order.customer_email}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{order.items.length} units archived</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       {order.items.map((item, i) => (
                         <div key={i} className="group relative">
                           <img src={item.thumbnail_url} className="w-8 h-10 object-cover border border-zinc-700 transition-all" />
                         </div>
                       ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-white">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-sm border ${
                      order.status === 'completed' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 
                      order.status === 'pending' ? 'border-fuchsia-studio/20 text-fuchsia-studio bg-fuchsia-studio/5' : 'border-zinc-500/20 text-zinc-500'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      className="bg-black border border-zinc-700 text-[10px] uppercase font-black px-3 py-1 focus:outline-none focus:border-white transition-colors"
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
    </div>
  );
};

export default Admin;
