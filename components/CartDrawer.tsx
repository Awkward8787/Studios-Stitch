
import React from 'react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string, size: string) => void;
  onCheckout: () => void;
  isProcessing: boolean;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onRemove, onCheckout, isProcessing }) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-black h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 flex justify-between items-center border-b border-zinc-800">
          <h2 className="text-xl font-bold uppercase tracking-tighter">Your Bag</h2>
          <button onClick={onClose} className="p-2 hover:text-zinc-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 uppercase tracking-widest text-sm">Bag is empty</p>
              <button 
                onClick={onClose}
                className="mt-6 border border-zinc-700 px-6 py-3 text-xs uppercase font-bold hover:bg-white hover:text-black transition-all"
              >
                Shop Now
              </button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4 group">
                <div className="w-20 h-24 bg-zinc-900 overflow-hidden">
                  <img src={item.thumbnail_url} className="w-full h-full object-cover grayscale" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between">
                    <h3 className="text-sm font-bold uppercase truncate pr-4">{item.name}</h3>
                    <button 
                      onClick={() => onRemove(item.id, item.selectedSize)}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 uppercase">Size: {item.selectedSize}</p>
                  <p className="text-xs text-zinc-500 mt-1">Qty: {item.quantity}</p>
                  <p className="mt-auto text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-zinc-800 space-y-4">
            <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase">Shipping and taxes calculated at checkout.</p>
            <button 
              onClick={onCheckout}
              disabled={isProcessing}
              className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Secure Checkout'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
