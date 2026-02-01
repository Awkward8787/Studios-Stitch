
-- STUDIOS STITCH: MASTER INFRASTRUCTURE SCHEMA
-- This script sets up the entire database architecture for the platform.

-- 1. PROFILES (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. REVIEWS (User product feedback)
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  user_email text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. WISHLIST (User-prioritized objects)
create table public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, product_id)
);

-- 4. ORDERS (Transaction logs)
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

-- 5. COMMUNITY ASSETS (Gallery submission archive)
create table public.community_assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  title text not null,
  image_url text not null,
  artist_name text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;
alter table public.community_assets enable row level security;

-- POLICIES: PROFILES
create policy "Profiles: Private View" on public.profiles for select using (auth.uid() = id);

-- POLICIES: REVIEWS
create policy "Reviews: Public View" on public.reviews for select using (true);
create policy "Reviews: Auth Insert" on public.reviews for insert with check (auth.role() = 'authenticated');

-- POLICIES: WISHLIST
create policy "Wishlist: Private Access" on public.wishlist for all using (auth.uid() = user_id);

-- POLICIES: ORDERS
create policy "Orders: Private View" on public.orders for select using (auth.uid() = user_id);
create policy "Orders: Admin All" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- POLICIES: COMMUNITY ASSETS
create policy "Assets: Public View" on public.community_assets for select using (true);
create policy "Assets: Auth Insert" on public.community_assets for insert with check (auth.role() = 'authenticated');
create policy "Assets: Admin All" on public.community_assets for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- AUTO-CREATE PROFILE ON SIGNUP
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
  for each row execute procedure public.handle_new_user();
