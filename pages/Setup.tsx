
import React, { useState } from 'react';
import { configService, AppConfig } from '../services/configService';
import { supabaseService } from '../services/supabaseService';
import { stripeService } from '../services/stripeService';

const Setup: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());
  const [status, setStatus] = useState<{ supabase: boolean | null, stripe: boolean | null }>({
    supabase: null,
    stripe: null
  });

  const handleSave = () => {
    configService.updateConfig(config);
    alert("SYSTEM REBOOT: Credentials Saved.");
  };

  const testSupabase = async () => {
    const ok = await supabaseService.testConnection();
    setStatus(prev => ({ ...prev, supabase: ok }));
  };

  const testStripe = async () => {
    const ok = await stripeService.testConnection();
    setStatus(prev => ({ ...prev, stripe: ok }));
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-32">
      <div className="mb-16 border-l-4 border-fuchsia-studio pl-8">
        <h1 className="text-6xl font-black uppercase tracking-tighter italic">Terminal Config</h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">
          Establish Secure Bridge to Production Infrastructure
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Supabase Block */}
        <div className="space-y-8 bg-zinc-900/50 p-8 border border-zinc-800 stitch-corner relative">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Supabase Cloud</h3>
            <div className={`w-2 h-2 rounded-full ${status.supabase === true ? 'bg-fuchsia-studio shadow-[0_0_10px_#C0005A]' : 'bg-zinc-800'}`} />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Project URL</label>
              <input 
                type="text"
                className="w-full bg-black border border-zinc-800 p-4 text-[10px] font-mono focus:border-fuchsia-studio outline-none transition-colors"
                value={config.supabaseUrl}
                onChange={e => setConfig({ ...config, supabaseUrl: e.target.value })}
                placeholder="https://xyz.supabase.co"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Anon Public Key</label>
              <input 
                type="password"
                className="w-full bg-black border border-zinc-800 p-4 text-[10px] font-mono focus:border-fuchsia-studio outline-none transition-colors"
                value={config.supabaseAnonKey}
                onChange={e => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiI..."
              />
            </div>
          </div>
          
          <button 
            onClick={testSupabase}
            className="w-full py-3 border border-zinc-700 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            Run Handshake
          </button>
        </div>

        {/* Stripe Block */}
        <div className="space-y-8 bg-zinc-900/50 p-8 border border-zinc-800 stitch-corner relative">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Stripe Payments</h3>
            <div className={`w-2 h-2 rounded-full ${status.stripe === true ? 'bg-fuchsia-studio shadow-[0_0_10px_#C0005A]' : 'bg-zinc-800'}`} />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Publishable Key</label>
              <input 
                type="text"
                className="w-full bg-black border border-zinc-800 p-4 text-[10px] font-mono focus:border-fuchsia-studio outline-none transition-colors"
                value={config.stripePublicKey}
                onChange={e => setConfig({ ...config, stripePublicKey: e.target.value })}
                placeholder="pk_live_..."
              />
            </div>
          </div>
          
          <div className="p-4 bg-black/50 border border-zinc-800/50">
             <p className="text-[8px] text-zinc-600 leading-relaxed uppercase tracking-widest font-bold">
               Note: Direct Stripe integration requires a valid backend endpoint for session creation. 
               This portal verifies the Public Key handshake only.
             </p>
          </div>

          <button 
            onClick={testStripe}
            className="w-full py-3 border border-zinc-700 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            Verify Protocol
          </button>
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <button 
          onClick={handleSave}
          className="bg-fuchsia-studio text-white px-24 py-6 font-black uppercase tracking-[0.5em] text-xs hover:bg-white hover:text-black transition-all shadow-2xl"
        >
          Execute Sync
        </button>
      </div>

      <div className="mt-24 border-t border-zinc-900 pt-12">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-6 text-center">Reference Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[9px] text-zinc-600 uppercase leading-loose tracking-widest">
           <div>
              <p className="font-black text-zinc-400 mb-2 underline italic">Supabase Deployment:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Create project at app.supabase.com</li>
                <li>Execute SQL manifest provided in docs</li>
                <li>Enable Magic Link auth for studiosstitch.com</li>
              </ol>
           </div>
           <div>
              <p className="font-black text-zinc-400 mb-2 underline italic">Stripe Activation:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Go to Stripe Dashboard &gt; API Keys</li>
                <li>Copy 'Publishable key' to terminal</li>
                <li>Whitelist studiosstitch.com in Checkout settings</li>
              </ol>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;
