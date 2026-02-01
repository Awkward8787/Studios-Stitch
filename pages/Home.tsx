
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface HomeProps {
  products: Product[];
  onAddToCart: (product: Product, size: string) => void;
}

const Home: React.FC<HomeProps> = ({ products, onAddToCart }) => {
  return (
    <div className="flex flex-col bg-black">
      {/* Threadless Style Hero Banner */}
      <section className="relative px-6 py-12">
        <Link to="/shop" className="group block relative aspect-[21/9] md:aspect-[21/6] bg-zinc-900 overflow-hidden rounded-sm border border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-studio/40 to-black/80 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover grayscale opacity-50 transition-transform duration-700 group-hover:scale-105" 
            alt="Hero Banner"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 md:px-24 max-w-4xl">
            <span className="text-fuchsia-studio font-black uppercase tracking-[0.4em] text-xs mb-4">Limited Edition Release</span>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none italic mb-8">
              THE <span className="text-fuchsia-studio">STITCH</span><br/>ARCHIVE 01.
            </h1>
            <div className="flex gap-4">
              <span className="bg-white text-black px-10 py-4 font-black uppercase text-[10px] tracking-widest group-hover:bg-fuchsia-studio group-hover:text-white transition-all">Shop All Shirts</span>
            </div>
          </div>
        </Link>
      </section>

      {/* Shop By Category Circles */}
      <section className="py-12 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { name: 'T-Shirts', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&h=300&fit=crop' },
              { name: 'Hoodies', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop' },
              { name: 'Art Prints', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&h=300&fit=crop' },
              { name: 'Accessories', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop' }
            ].map(cat => (
              <Link key={cat.name} to="/shop" className="group flex flex-col items-center gap-4">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-zinc-900 group-hover:border-fuchsia-studio transition-all">
                  <img src={cat.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt={cat.name} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Grid */}
      <section className="py-20 px-6 max-w-[1600px] mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">New Designer Drops</h2>
            <div className="h-1 w-20 bg-fuchsia-studio mt-2" />
          </div>
          <Link to="/shop" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-fuchsia-studio">See Everything →</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {products.slice(0, 12).map(product => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
          ))}
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-zinc-950 border-y border-zinc-900 py-24 px-6 overflow-hidden">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-8">
            <h2 className="text-6xl font-black uppercase tracking-tighter leading-none italic">
              BUILT BY <br/>
              <span className="text-fuchsia-studio underline decoration-8 decoration-white underline-offset-8">THE COMMUNITY.</span>
            </h2>
            <p className="text-zinc-500 text-sm uppercase tracking-widest leading-loose font-bold max-w-md">
              Studios Stitch is more than a brand. It's a platform for subversive artists and underground designers. Submit your art and join the archive.
            </p>
            <div className="flex gap-6">
              <Link to="/gallery" className="bg-white text-black px-12 py-5 font-black uppercase tracking-widest text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all">Submit Your Art</Link>
              <Link to="/gallery" className="border border-zinc-800 text-white px-12 py-5 font-black uppercase tracking-widest text-[10px] hover:border-white transition-all">View Archive</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 rotate-3 opacity-20">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-zinc-900 border border-zinc-800 stitch-corner" />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-10">
          <h3 className="text-4xl font-black uppercase tracking-tighter italic">Get the Latest Manifestos</h3>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-bold">New drops, artist spotlights, and exclusive access codes.</p>
          <div className="flex max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="YOUR@EMAIL.COM" 
              className="flex-1 bg-zinc-900 border border-zinc-800 px-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-fuchsia-studio"
            />
            <button className="bg-fuchsia-studio text-white px-10 py-4 font-black uppercase text-[10px] tracking-widest">Join</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
