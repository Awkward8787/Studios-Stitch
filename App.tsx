
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, Link, useNavigate } from 'react-router-dom';
import { Product, CartItem, User } from './types';
import { printfulService } from './services/printfulService';
import { stripeService } from './services/stripeService';
import { supabaseService } from './services/supabaseService';
import { configService } from './services/configService';

// Components
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Collections from './pages/Collections';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import Setup from './pages/Setup';
import Profile from './pages/Profile';
import OpeningSequence from './components/OpeningSequence';

const Footer: React.FC = () => (
  <footer className="bg-black border-t border-zinc-900 py-24 px-6 mt-24 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-5">
      <img src="logo.png" className="w-64 grayscale invert" alt="" />
    </div>
    
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
      <div className="col-span-1 md:col-span-2 space-y-6">
        <Link to="/" className="inline-block h-8">
           <img src="logo.png" className="h-full w-auto grayscale invert" alt="Studios Stitch" />
        </Link>
        <p className="text-zinc-500 text-[10px] tracking-[0.3em] max-w-sm uppercase leading-loose">
          Modular silhouettes constructed for creative disruption. A technical archive for the modern uniform.
        </p>
        <div className="flex gap-4">
           <span className="wound-stitch">× × ×</span>
        </div>
      </div>
      <div className="space-y-6">
        <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-white">Archive</h4>
        <ul className="text-[10px] space-y-4 uppercase tracking-[0.3em] text-zinc-500 font-bold">
          <li><Link to="/shop" className="hover:text-fuchsia-studio transition-colors">All Objects</Link></li>
          <li><Link to="/collections" className="hover:text-fuchsia-studio transition-colors">Series 01</Link></li>
          <li><Link to="/shop" className="hover:text-fuchsia-studio transition-colors">New Deployment</Link></li>
        </ul>
      </div>
      <div className="space-y-6">
        <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-white">Terminal</h4>
        <ul className="text-[10px] space-y-4 uppercase tracking-[0.3em] text-zinc-500 font-bold">
          <li><a href="https://instagram.com" target="_blank" className="hover:text-fuchsia-studio transition-colors">Instagram</a></li>
          <li><a href="#" className="hover:text-fuchsia-studio transition-colors">Support Portal</a></li>
          <li><Link to="/admin" className="hover:text-fuchsia-studio transition-colors">Admin Access</Link></li>
          <li><Link to="/setup" className="hover:text-fuchsia-studio transition-colors">Config Console</Link></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-zinc-900/50 flex flex-col md:flex-row justify-between items-center gap-6">
      <p className="text-[9px] text-zinc-700 uppercase tracking-[0.5em]">© 2024 Studios Stitch. Registered Archive: www.studiosstitch.com</p>
      <div className="flex gap-12 text-[9px] text-zinc-700 uppercase tracking-[0.5em] font-black">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of Trade</a>
      </div>
    </div>
  </footer>
);

const AuthPage: React.FC<{ onAuthSuccess: (user: User) => void }> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (configService.isConfigured()) {
        await supabaseService.signIn(email);
        alert("SECURITY_LINK_DISPATCHED: Check your inbox for identity verification.");
      } else {
        const user = await supabaseService.getCurrentUser() || { id: 'dev', email, role: 'user' };
        onAuthSuccess(user as User);
        navigate('/');
      }
    } catch (err: any) {
      alert(err.message || "Auth Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-48 px-6 text-center">
      <div className="mb-12">
        <span className="text-fuchsia-studio font-black text-2xl italic">× × ×</span>
      </div>
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white italic">Security Clearance</h2>
      <p className="text-zinc-600 text-[10px] uppercase tracking-[0.4em] mb-12">Authorized Personnel Only // Bridge Identity Verification</p>
      <form onSubmit={handleSignIn} className="space-y-4">
        <input 
          type="email" 
          placeholder="USER@STUDIOSSTITCH.COM"
          required
          className="w-full bg-black border border-zinc-900 p-5 text-[10px] uppercase tracking-[0.3em] font-black focus:outline-none focus:border-fuchsia-studio transition-colors text-white placeholder:text-zinc-800"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button 
          disabled={loading}
          className="w-full bg-white text-black py-5 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'PROCESSING...' : 'REQUEST ACCESS'}
        </button>
      </form>
    </div>
  );
};

const CheckoutSuccess: React.FC = () => (
  <div className="max-w-md mx-auto py-48 px-6 text-center space-y-8">
    <div className="w-20 h-20 bg-fuchsia-studio/10 text-fuchsia-studio rounded-none border border-fuchsia-studio/30 flex items-center justify-center mx-auto transform rotate-45">
      <svg className="transform -rotate-45" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <div className="space-y-4">
      <h2 className="text-5xl font-black uppercase tracking-tighter italic">Transaction Verified</h2>
      <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold">Deployment of objects initiated. Status: Processing.</p>
    </div>
    <Link to="/shop" className="inline-block border border-zinc-800 px-12 py-5 text-[10px] uppercase font-black tracking-[0.4em] hover:bg-white hover:text-black transition-all">
      Return to Terminal
    </Link>
  </div>
);

const ProductDetailWrapper: React.FC<{ onAddToCart: (p: Product, s: string) => void, currentUser: User | null }> = ({ onAddToCart, currentUser }) => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/shop" />;
  return <ProductDetail productId={id} onAddToCart={onAddToCart} currentUser={currentUser} />;
};

const AppContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedProducts, currentUser] = await Promise.all([
          printfulService.fetchProducts(),
          supabaseService.getCurrentUser()
        ]);
        setProducts(fetchedProducts);
        setUser(currentUser);
      } catch (err) {
        console.error("Initialization failed", err);
      }
    };
    loadData();
  }, []);

  const handleAddToCart = (product: Product, size: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id && i.selectedSize === size);
      if (existing) {
        return prev.map(i => i.id === product.id && i.selectedSize === size 
          ? { ...i, quantity: i.quantity + 1 } 
          : i
        );
      }
      return [...prev, { ...product, selectedSize: size, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (id: string, size: string) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.selectedSize === size)));
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      setIsCartOpen(false);
      return;
    }

    setIsProcessing(true);
    try {
      const { url } = await stripeService.createCheckoutSession(cart, user.email);
      window.location.href = url;
    } catch (err: any) {
      console.error("Checkout failed", err);
      alert(err.message || "Checkout Protocol Failure");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setUser(null);
    navigate('/');
  };

  if (showIntro) {
    return <OpeningSequence onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-fuchsia-studio selection:text-white animate-in fade-in duration-1000">
      <Navbar 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        userEmail={user?.email || null}
        onLogout={handleLogout}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
      />

      <main>
        <Routes>
          <Route path="/" element={<Home products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/shop" element={<Shop products={products} onAddToCart={handleAddToCart} />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/product/:id" element={<ProductDetailWrapper onAddToCart={handleAddToCart} currentUser={user} />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/auth" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/auth" element={<AuthPage onAuthSuccess={setUser} />} />
          <Route path="/checkout-success" element={<CheckoutSuccess />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
