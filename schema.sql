
-- STUDIOS STITCH: MASTER INFRASTRUCTURE SCHEMA
-- Execute this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. PROFILES (Identity Manifest)
-- Extends the base auth.users table with custom metadata
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. REVIEWS (Diagnostic Logs)
-- Stores field reports/comments left by users on specific products
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  user_id uuid references auth.users on delete cascade not null,
  user_email text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. WISHLIST (Reserved Manifest)
-- Priority assets saved by users to their private collection
create table public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, product_id)
);

-- 4. ORDERS (Acquisition History)
-- Records of completed transactions and their status
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  customer_email text not null,
  items jsonb not null, -- Stores the CartItem array
  total numeric not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'shipped')),
  stripe_session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. ROW LEVEL SECURITY (RLS)
-- Prevent unauthorized access to sensitive data
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;

-- 6. SECURITY POLICIES
-- Profiles: Users see/edit only themselves
create policy "Profiles: Private View" on public.profiles for select using (auth.uid() = id);
create policy "Profiles: Private Edit" on public.profiles for update using (auth.uid() = id);

-- Reviews: Publicly readable, privately writable
create policy "Reviews: Public Sync" on public.reviews for select using (true);
create policy "Reviews: Auth Insert" on public.reviews for insert with check (auth.role() = 'authenticated');

-- Wishlist: Strictly private
create policy "Wishlist: Private Access" on public.wishlist for all using (auth.uid() = user_id);

-- Orders: Users see own, Admins see all
create policy "Orders: Private View" on public.orders for select using (auth.uid() = user_id);
create policy "Orders: Admin View" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 7. AUTOMATION: PROFILE GENERATOR
-- Automatically creates a 'profiles' entry when a user signs up via Magic Link
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
