
import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { CommunityAsset, User } from '../types';
import AssetUploadModal from '../components/AssetUploadModal';

interface GalleryProps {
  currentUser: User | null;
}

const Gallery: React.FC<GalleryProps> = ({ currentUser }) => {
  const [assets, setAssets] = useState<CommunityAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    const data = await supabaseService.getAssets();
    setAssets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAssets();
  }, []);

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">
            ASSET <span className="text-fuchsia-studio">ARCHIVE</span>
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mt-6 font-bold">
            Visual Manifestos // Community Submitted Imagery
          </p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="bg-white text-black px-12 py-5 font-black uppercase tracking-widest text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all shadow-2xl"
        >
          Push New Asset +
        </button>
      </div>

      {loading ? (
        <div className="py-48 flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-zinc-900 border-t-fuchsia-studio rounded-full animate-spin mb-8" />
          <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500">Retrieving Archive Data...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-32 text-center border border-zinc-900 bg-zinc-900/10 stitch-corner">
          <p className="text-zinc-600 uppercase tracking-[0.4em] text-[10px] font-black italic">Archive is currently empty. Be the first to submit.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {assets.map((asset) => (
            <div key={asset.id} className="relative group overflow-hidden border border-zinc-900 hover:border-fuchsia-studio/50 transition-all stitch-corner break-inside-avoid">
              <img 
                src={asset.image_url} 
                alt={asset.title}
                className="w-full h-auto grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <span className="text-fuchsia-studio text-[8px] font-black uppercase tracking-[0.3em] mb-2">Asset_ID: {asset.id.slice(0,8)}</span>
                <h3 className="text-white text-lg font-black uppercase tracking-tight mb-1 italic">{asset.title}</h3>
                <p className="text-zinc-400 text-[9px] uppercase font-bold tracking-widest">Captured by {asset.artist_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AssetUploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={loadAssets}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Gallery;
