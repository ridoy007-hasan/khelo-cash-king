-- ============================================
-- KHELO CASH KING — DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- (Project > SQL Editor > New query > paste > Run)
-- ============================================

-- 1. PROFILES TABLE
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  phone text,
  full_name text,
  avatar_url text,
  wallet_balance numeric default 0,
  total_matches_played integer default 0,
  total_won numeric default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view all profiles" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- 2. USER ROLES TABLE (for admin access)
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('player', 'admin')),
  created_at timestamptz default now(),
  unique(user_id, role)
);

alter table user_roles enable row level security;

create policy "Users can view their own roles" on user_roles
  for select using (auth.uid() = user_id);

-- 3. MATCHES TABLE
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  game_mode text not null check (game_mode in ('br', 'clash_squad', 'lone_wolf', 'cs_1v1_2v2')),
  match_type text not null default 'Squad',
  map_name text,
  match_datetime timestamptz not null,
  entry_fee numeric not null default 0,
  win_prize numeric not null default 0,
  per_kill_prize numeric not null default 0,
  max_slots integer not null default 8,
  filled_slots integer not null default 0,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed', 'cancelled')),
  room_id text,
  room_password text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table matches enable row level security;

create policy "Anyone can view matches" on matches
  for select using (true);

create policy "Admins can insert matches" on matches
  for insert with check (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can update matches" on matches
  for update using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- 4. MATCH PARTICIPANTS TABLE
create table if not exists match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  ign text,
  joined_at timestamptz default now(),
  kills integer,
  prize_won numeric default 0,
  screenshot_url text,
  unique(match_id, user_id)
);

alter table match_participants enable row level security;

create policy "Users can view participants of matches" on match_participants
  for select using (true);

create policy "Users can join matches as themselves" on match_participants
  for insert with check (auth.uid() = user_id);

create policy "Admins can update participants" on match_participants
  for update using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- 5. WALLET TRANSACTIONS TABLE
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdraw', 'entry_fee', 'prize')),
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payment_method text check (payment_method in ('bKash', 'Nagad')),
  sender_number text,
  transaction_id text,
  admin_note text,
  created_at timestamptz default now()
);

alter table wallet_transactions enable row level security;

create policy "Users can view their own transactions" on wallet_transactions
  for select using (
    auth.uid() = user_id
    or exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Users can insert their own transactions" on wallet_transactions
  for insert with check (auth.uid() = user_id);

create policy "Admins can update transactions" on wallet_transactions
  for update using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- 6. WITHDRAW REQUESTS TABLE
create table if not exists withdraw_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null,
  payment_method text not null check (payment_method in ('bKash', 'Nagad')),
  receiver_number text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz default now()
);

alter table withdraw_requests enable row level security;

create policy "Users can view their own withdraw requests" on withdraw_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Users can insert their own withdraw requests" on withdraw_requests
  for insert with check (auth.uid() = user_id);

create policy "Admins can update withdraw requests" on withdraw_requests
  for update using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ============================================
-- IMPORTANT: Admins also need to be able to update
-- OTHER users' profiles (wallet_balance) when approving
-- deposits, withdrawals, or distributing prizes.
-- Add a broader policy for that:
-- ============================================

create policy "Admins can update any profile" on profiles
  for update using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert transactions for any user" on wallet_transactions
  for insert with check (
    auth.uid() = user_id
    or exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ============================================
-- DONE. Next steps:
-- 1. Go to Authentication > Settings and DISABLE "Confirm email"
--    (since we use phone-based fake emails, no real inbox exists)
-- 2. Sign up once in the app, then run this to make yourself admin:
--
--    insert into user_roles (user_id, role)
--    values ('YOUR-USER-ID-HERE', 'admin');
--
--    (Find your user ID in Authentication > Users after signing up)
-- ============================================
