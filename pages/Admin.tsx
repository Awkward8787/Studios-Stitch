
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
      <div className="mb-12">
        <h1 className="text-4xl font-bold uppercase tracking-tighter">Terminal</h1>
        <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">Global Order & Logistics Center</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">Total Gross</p>
          <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">Total Volume</p>
          <p className="text-3xl font-bold">{stats.totalOrders} Units</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2">Active Pipeline</p>
          <p className="text-3xl font-bold text-yellow-500">{stats.pendingOrders} Orders</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50 text-xs uppercase tracking-widest text-zinc-400 font-bold border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Serial ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4 text-right">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 uppercase tracking-widest">Database Clean: No Orders Found</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-xs">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customer_email}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{order.items.length} items</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                      order.status === 'completed' ? 'bg-green-500/20 text-green-500' : 
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <select 
                      className="bg-black border border-zinc-700 text-[10px] uppercase font-bold px-3 py-1 rounded-sm focus:outline-none focus:border-white transition-colors"
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
