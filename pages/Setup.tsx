
import React, { useState } from 'react';
import { configService, AppConfig } from '../services/configService';
import { supabaseService } from '../services/supabaseService';
import { stripeService } from '../services/stripeService';

const Setup: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());
  const [activeTab, setActiveTab] = useState<'creds' | 'sql'>('creds');
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

  const masterSql = `-- STUDIOS STITCH: MASTER INFRASTRUCTURE SCHEMA
-- Execute this in the Supabase SQL Editor

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  user_email text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, product_id)
);

create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  customer_email text not null,
  items jsonb not null,
  total numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'shipped')),
  stripe_session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;

create policy "Profiles: Private View" on public.profiles for select using (auth.uid() = id);
create policy "Reviews: Public Sync" on public.reviews for select using (true);
create policy "Wishlist: Private Access" on public.wishlist for all using (auth.uid() = user_id);
create policy "Orders: Private View" on public.orders for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-32">
      <div className="mb-16 border-l-4 border-fuchsia-studio pl-8 flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic">Terminal Config</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">
            Establish Secure Bridge to Production Infrastructure
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('creds')}
            className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 border ${activeTab === 'creds' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}
          >
            Bridge Credentials
          </button>
          <button 
            onClick={() => setActiveTab('sql')}
            className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 border ${activeTab === 'sql' ? 'bg-white text-black' : 'border-zinc-800 text-zinc-500'}`}
          >
            Database Manifest
          </button>
        </div>
      </div>

      {activeTab === 'creds' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
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
                  className="w-full bg-black border border-zinc-800 p-4 text-[10px] font-mono focus:border-fuchsia-studio outline-none transition-colors text-white"
                  value={config.supabaseUrl}
                  onChange={e => setConfig({ ...config, supabaseUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Anon Public Key</label>
                <input 
                  type="password"
                  className="w-full bg-black border border-zinc-800 p-4 text-[10px] font-mono focus:border-fuchsia-studio outline-none transition-colors text-white"
                  value={config.supabaseAnonKey}
                  onChange={e => setConfig({ ...config, supabaseAnonKey: e.target.value })}
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
                  className="w-full bg-black border border-zinc-800 p-4 text-[10px] font-mono focus:border-fuchsia-studio outline-none transition-colors text-white"
                  value={config.stripePublicKey}
                  onChange={e => setConfig({ ...config, stripePublicKey: e.target.value })}
                />
              </div>
            </div>
            
            <div className="p-4 bg-black/50 border border-zinc-800/50">
               <p className="text-[8px] text-zinc-600 leading-relaxed uppercase tracking-widest font-bold">
                 Note: Checkout integration requires a valid backend endpoint. This portal verifies the Public Key handshake only.
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
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-zinc-900/80 border border-zinc-800 p-8 stitch-corner">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Master SQL Schema</h3>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(masterSql);
                  alert("SQL Copied to Clipboard.");
                }}
                className="text-[9px] font-black uppercase tracking-widest text-fuchsia-studio border-b border-fuchsia-studio"
              >
                Copy Script
              </button>
            </div>
            <pre className="bg-black p-6 text-[10px] font-mono text-zinc-500 overflow-x-auto border border-zinc-900 max-h-[50vh]">
              {masterSql}
            </pre>
            <p className="mt-6 text-[9px] text-zinc-500 uppercase tracking-widest font-bold leading-relaxed italic">
              * Action Required: Paste this into your Supabase SQL Editor and run it to initialize your database tables and security policies.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'creds' && (
        <div className="mt-12 flex justify-center">
          <button 
            onClick={handleSave}
            className="bg-fuchsia-studio text-white px-24 py-6 font-black uppercase tracking-[0.5em] text-xs hover:bg-white hover:text-black transition-all shadow-2xl"
          >
            Execute Sync
          </button>
        </div>
      )}
    </div>
  );
};

export default Setup;
