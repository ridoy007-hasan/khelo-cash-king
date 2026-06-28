-- ============================================
-- NEW FEATURES MIGRATION
-- Run this in Supabase SQL Editor (after the original schema)
-- ============================================

-- 1. Add columns to matches table
alter table matches add column if not exists hide_player_names boolean default false;
alter table matches add column if not exists teams_shuffled boolean default false;

-- 2. Add slot_number to match_participants (so we know exactly which slot each player is in)
alter table match_participants add column if not exists slot_number integer;

-- Prevent two players from ever occupying the same slot in the same match
create unique index if not exists match_participants_unique_slot
  on match_participants (match_id, slot_number)
  where slot_number is not null;

-- 3. Table to store the admin's pending auto-register trigger for a match
create table if not exists slot_auto_register (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete cascade,
  admin_ign text not null,
  trigger_slot integer not null, -- the slot that, once filled, triggers registration
  target_slot integer not null,  -- the slot the admin will be placed into
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'cancelled')),
  created_at timestamptz default now(),
  unique(match_id, admin_user_id)
);

alter table slot_auto_register enable row level security;

create policy "Admins can view their own auto-register triggers" on slot_auto_register
  for select using (
    auth.uid() = admin_user_id
    or exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert their own auto-register triggers" on slot_auto_register
  for insert with check (
    auth.uid() = admin_user_id
    and exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can update their own auto-register triggers" on slot_auto_register
  for update using (
    auth.uid() = admin_user_id
    or exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete their own auto-register triggers" on slot_auto_register
  for delete using (
    auth.uid() = admin_user_id
    or exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- 4. Enable Realtime on match_participants so the app can listen for new joins live
alter publication supabase_realtime add table match_participants;

-- ============================================
-- DONE.
-- ============================================
