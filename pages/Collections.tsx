
import React from 'react';
import { Link } from 'react-router-dom';

const Collections: React.FC = () => {
  const collectionList = [
    {
      title: "Season 01: The Architect",
      desc: "Structured silhouettes designed for modular living.",
      img: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000&auto=format&fit=crop",
      link: "/shop"
    },
    {
      title: "Monochrome Study",
      desc: "An exploration of black and white through heavy-weight cotton.",
      img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop",
      link: "/shop"
    }
  ];

  return (
    <div className="pt-24 space-y-24">
      <div className="px-6 max-w-7xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter mb-4">Archives</h1>
        <p className="text-zinc-500 uppercase tracking-widest text-sm">Curated stories and seasonal drops.</p>
      </div>

      {collectionList.map((col, idx) => (
        <section key={col.title} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} bg-zinc-900/30`}>
          <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden">
            <img src={col.img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt={col.title} />
          </div>
          <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center items-start space-y-6">
            <span className="text-zinc-600 text-xs font-bold uppercase tracking-[0.3em]">0{idx + 1} / Collection</span>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none">{col.title}</h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-md uppercase tracking-wide">{col.desc}</p>
            <Link to={col.link} className="border-b border-white pb-2 text-xs uppercase font-bold tracking-widest hover:text-zinc-400 hover:border-zinc-400 transition-all">
              Discover Series
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
};

export default Collections;
