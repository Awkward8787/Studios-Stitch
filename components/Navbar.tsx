
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  cartCount: number;
  onCartToggle: () => void;
  userEmail: string | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartToggle, userEmail, onLogout }) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-black/95 backdrop-blur-sm border-b border-zinc-900 py-4 px-6">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link to="/" className="group block h-10">
              <img 
                src="logo.png" 
                alt="Studios Stitch" 
                className="h-full w-auto logo-glow grayscale transition-all group-hover:grayscale-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xl font-black uppercase tracking-tighter">Studios<span class="text-fuchsia-studio">Stitch</span></span>';
                }}
              />
            </Link>
            
            <nav className="hidden md:flex gap-10 text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500">
              <Link to="/shop" className={`hover:text-white transition-all relative ${location.pathname === '/shop' ? 'text-white' : ''}`}>
                Inventory
                {location.pathname === '/shop' && <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-fuchsia-studio" />}
              </Link>
              <Link to="/collections" className={`hover:text-white transition-all relative ${location.pathname === '/collections' ? 'text-white' : ''}`}>
                Series
                {location.pathname === '/collections' && <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-fuchsia-studio" />}
              </Link>
              <Link to="/lab" className={`hover:text-fuchsia-studio transition-all relative ${location.pathname === '/lab' ? 'text-fuchsia-studio' : ''}`}>
                Lab
                {location.pathname === '/lab' && <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-fuchsia-studio" />}
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-2">
              <span className="wound-stitch">× × ×</span>
              <span className="text-[8px] font-black text-zinc-700 tracking-[0.4em] uppercase">Status: Live</span>
            </div>

            <div className="flex items-center gap-6">
              {userEmail ? (
                <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-fuchsia-studio transition-colors">
                  Disconnect
                </button>
              ) : (
                <Link to="/auth" className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                  Authenticate
                </Link>
              )}
              
              <button onClick={onCartToggle} className="relative group">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black tracking-tighter group-hover:text-fuchsia-studio transition-colors">BAG</span>
                  <div className="h-[1px] w-full bg-zinc-800 group-hover:bg-fuchsia-studio transition-colors" />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-3 -right-3 bg-fuchsia-studio text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="stitch-line-h w-full opacity-50" />
    </header>
  );
};

export default Navbar;
