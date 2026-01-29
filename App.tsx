
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, Link, useNavigate } from 'react-router-dom';
import { Product, CartItem, User } from './types';
import { printfulService } from './services/printfulService';
import { stripeService } from './services/stripeService';
import { supabaseService } from './services/supabaseService';

// Components
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Collections from './pages/Collections';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';

const Footer: React.FC = () => (
  <footer className="bg-black border-t border-zinc-900 py-16 px-6 mt-24">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-2 space-y-4">
        <h3 className="text-xl font-bold tracking-tighter uppercase">Studios Stitch</h3>
        <p className="text-zinc-500 text-xs tracking-wide max-w-sm uppercase">
          A design collective focused on the intersection of function and form. Premium basics for modern life.
        </p>
      </div>
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Inventory</h4>
        <ul className="text-xs space-y-2 uppercase tracking-widest text-zinc-500">
          <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
          <li><Link to="/collections" className="hover:text-white transition-colors">Featured Series</Link></li>
          <li><Link to="/shop" className="hover:text-white transition-colors">New Drops</Link></li>
        </ul>
      </div>
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Connect</h4>
        <ul className="text-xs space-y-2 uppercase tracking-widest text-zinc-500">
          <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">© 2024 Studios Stitch. Developed by Studio Engine.</p>
      <div className="flex gap-8 text-[10px] text-zinc-600 uppercase tracking-widest">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
      </div>
    </div>
  </footer>
);

const AuthPage: React.FC<{ onAuthSuccess: (user: User) => void }> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await supabaseService.signIn(email);
    onAuthSuccess(user);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto py-32 px-6 text-center">
      <h2 className="text-3xl font-bold uppercase tracking-tighter mb-8 text-white">Identity Verification</h2>
      <form onSubmit={handleSignIn} className="space-y-4">
        <input 
          type="email" 
          placeholder="USER@DOMAIN.COM"
          required
          className="w-full bg-black border border-zinc-800 p-4 text-xs uppercase tracking-widest focus:outline-none focus:border-white transition-colors text-white"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors">
          Authenticate
        </button>
      </form>
    </div>
  );
};

const CheckoutSuccess: React.FC = () => (
  <div className="max-w-md mx-auto py-32 px-6 text-center space-y-6">
    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <h2 className="text-3xl font-bold uppercase tracking-tighter">Success</h2>
    <p className="text-zinc-500 uppercase tracking-widest text-xs">Transaction completed successfully. Awaiting fulfillment.</p>
    <Link to="/shop" className="inline-block border border-zinc-700 px-8 py-4 text-xs uppercase font-bold hover:bg-white hover:text-black transition-all">
      Return to Gallery
    </Link>
  </div>
);

const ProductDetailWrapper: React.FC<{ onAddToCart: (p: Product, s: string) => void }> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/shop" />;
  return <ProductDetail productId={id} onAddToCart={onAddToCart} />;
};

const AppContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      await supabaseService.createOrder({
        customer_email: user.email,
        items: cart,
        total
      });
      const { url } = await stripeService.createCheckoutSession(cart, user.email);
      window.location.href = url;
    } catch (err) {
      console.error("Checkout failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await supabaseService.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
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
          <Route path="/" element={<Home products={products} />} />
          <Route path="/shop" element={<Shop products={products} />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/product/:id" element={<ProductDetailWrapper onAddToCart={handleAddToCart} />} />
          <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
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
