
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface HomeProps {
  products: Product[];
}

const Home: React.FC<HomeProps> = ({ products }) => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[95vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-black">
        {/* Gritty Texture Overlay */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover" 
            alt="Texture"
          />
        </div>

        {/* Large Background Graffiti Logo Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <img src="logo.png" className="w-[80%] max-w-5xl grayscale invert" alt="" />
        </div>

        <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
          <div className="mb-12 logo-glow">
            <img 
              src="logo.png" 
              className="w-48 md:w-80 h-auto mx-auto" 
              alt="Studios Stitch Logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-4">
              <span className="wound-stitch">× ×</span>
              <span className="text-[10px] uppercase font-black tracking-[0.8em] text-white">Advanced Textile Engineering</span>
              <span className="wound-stitch">× ×</span>
            </div>
            
            <h1 className="text-5xl md:text-[8rem] font-black tracking-tighter uppercase leading-[0.85] text-white italic">
              UNIFORM FOR THE<br/>
              <span className="text-transparent" style={{WebkitTextStroke: '1px rgba(255,255,255,0.8)'}}>UNDERGROUND</span>
            </h1>
            
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-[0.4em] max-w-xl mx-auto font-bold pt-6 border-t border-zinc-900 mt-8">
              Modular silhouettes constructed for <span className="text-fuchsia-studio">creative disruption</span>. 
              Archive 01 is now open for acquisition.
            </p>
            
            <div className="pt-16 flex flex-col md:flex-row gap-8 justify-center items-center">
              <Link 
                to="/shop" 
                className="group relative bg-white text-black px-16 py-5 font-black uppercase tracking-[0.2em] text-xs transition-all overflow-hidden"
              >
                <span className="relative z-10">Access Inventory</span>
                <div className="absolute top-0 left-0 w-full h-full bg-fuchsia-studio translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="absolute top-1 left-1 text-[8px] text-black">×</div>
                <div className="absolute bottom-1 right-1 text-[8px] text-black">×</div>
              </Link>
              
              <Link 
                to="/collections" 
                className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 hover:text-white transition-all flex items-center gap-4"
              >
                <span>View Archive</span>
                <span className="text-fuchsia-studio">/</span>
                <span>01</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Stitch Lines */}
        <div className="absolute top-1/4 left-0 stitch-line-h w-1/4 opacity-20" />
        <div className="absolute bottom-1/4 right-0 stitch-line-h w-1/4 opacity-20" />
      </section>

      {/* Featured Grid with Wound Stitches */}
      <section className="py-40 px-6 max-w-[1600px] mx-auto w-full relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-24 gap-12">
          <div className="relative">
             <div className="absolute -top-10 -left-6 text-fuchsia-studio text-6xl font-black opacity-10 select-none italic">× × ×</div>
             <span className="text-fuchsia-studio text-[10px] uppercase font-black tracking-[0.5em]">Protocol 001 / New Drops</span>
             <h2 className="text-6xl font-black uppercase tracking-tighter mt-4 text-white italic">Recent<br/>Manifestations</h2>
          </div>
          <div className="flex gap-12 items-center">
             <div className="hidden sm:block text-right">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Logistics</p>
                <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Duty Free Worldwide</p>
             </div>
             <Link to="/shop" className="bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-[0.3em] px-10 py-5 hover:border-fuchsia-studio hover:text-fuchsia-studio transition-all">
                Full Manifest
             </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Brand Terminal Section */}
      <section className="bg-fuchsia-studio text-white py-40 px-6 relative overflow-hidden">
        {/* Background 'Stitch' text */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 flex items-center justify-center pointer-events-none select-none">
          <div className="text-[25rem] font-black rotate-[-5deg] leading-none uppercase">STITCH</div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <div className="flex justify-center gap-6">
            <span className="text-4xl font-black italic">×</span>
            <span className="text-4xl font-black italic text-black">×</span>
            <span className="text-4xl font-black italic">×</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.85]">
            "Fabric is our <span className="text-black">canvas</span>. Thread is our <span className="underline decoration-black decoration-8 underline-offset-8">voice</span>."
          </h2>
          <div className="flex flex-col items-center gap-8 mt-12">
            <div className="h-[2px] w-48 bg-black/30" />
            <p className="text-white font-black leading-relaxed text-xs md:text-base uppercase tracking-[0.4em] max-w-2xl">
              Studios Stitch operates as a terminal for high-density textile assembly and subversive design. 
              Each garment is a unique iteration of the studio's vision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;