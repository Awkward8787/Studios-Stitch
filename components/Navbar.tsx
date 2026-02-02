
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { printfulService } from '../services/printfulService';

interface NavbarProps {
  cartCount: number;
  onCartToggle: () => void;
  userEmail: string | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartToggle, userEmail, onLogout }) => {
  const location = useLocation();
  const [isLive, setIsLive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const ok = await printfulService.testConnection();
      setIsLive(ok);
    };
    checkHealth();
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50">
      {/* Promo Bar */}
      <div className="bg-fuchsia-studio text-white text-[9px] font-black uppercase tracking-[0.3em] py-2 text-center">
        Free Shipping on all orders over $75 // Limited Edition Creator Drops
      </div>

      <div className="bg-black border-b border-zinc-900 py-4 px-6">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-10">
            <Link to="/" className="group block">
              <img src="https://res.cloudinary.com/dkolptikx/image/upload/v1770064247/ss-logo_zt5ylx.png" className="h-10 w-auto logo-glow" alt="Studios Stitch" />
            </Link>
            
            <nav className="hidden lg:flex gap-8 text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">
              <Link to="/shop" className="hover:text-fuchsia-studio transition-all">T-Shirts</Link>
              <Link to="/shop" className="hover:text-fuchsia-studio transition-all">Hoodies</Link>
              <Link to="/collections" className="hover:text-fuchsia-studio transition-all">Collections</Link>
              <Link to="/shop" className="hover:text-fuchsia-studio transition-all">Accessories</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-fuchsia-studio animate-pulse' : 'bg-zinc-800'}`} />
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Server_Live</span>
            </div>

            <div className="flex items-center gap-5">
              {userEmail ? (
                <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Logoff</button>
              ) : (
                <Link to="/auth" className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Login</Link>
              )}
              
              <button onClick={onCartToggle} className="relative bg-zinc-900 p-2 border border-zinc-800 hover:border-fuchsia-studio transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-fuchsia-studio text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
