
import React, { useState } from 'react';
import { User } from '../types';
import { supabaseService } from '../services/supabaseService';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: User | null;
}

const AssetUploadModal: React.FC<AssetUploadModalProps> = ({ isOpen, onClose, onSuccess, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    artist_name: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("AUTH_REQUIRED: Identity must be verified before pushing assets.");
      return;
    }
    setLoading(true);
    try {
      await supabaseService.addAsset({
        ...formData,
        user_id: currentUser.id
      });
      onSuccess();
      onClose();
      setFormData({ title: '', image_url: '', artist_name: '', description: '' });
    } catch (err) {
      alert("PUSH_FAILURE: Data stream corrupted.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-black border border-zinc-800 p-8 shadow-2xl stitch-corner animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Push to Archive</h2>
            <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Upload Protocol v1.0.2</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Asset Title</label>
            <input 
              required
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors"
              placeholder="e.g. NEON_CITY_ARCHIVE"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Image Source (URL)</label>
            <input 
              required
              type="url"
              className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors"
              placeholder="HTTPS://..."
              value={formData.image_url}
              onChange={e => setFormData({...formData, image_url: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Artist ID</label>
              <input 
                required
                className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none focus:border-fuchsia-studio transition-colors"
                placeholder="YOUR NAME"
                value={formData.artist_name}
                onChange={e => setFormData({...formData, artist_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Archive Category</label>
              <select className="w-full bg-zinc-900 border border-zinc-800 p-4 text-[10px] uppercase font-black tracking-widest outline-none appearance-none">
                <option>Conceptual_Art</option>
                <option>Lookbook_Shot</option>
                <option>User_Submit</option>
              </select>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-white text-black py-6 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-fuchsia-studio hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? 'UPLOADING...' : 'INITIATE DEPLOYMENT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssetUploadModal;
