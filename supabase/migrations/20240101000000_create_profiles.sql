-- Initial schema

create table if not exists public.profiles (
  id          uuid default gen_random_uuid() primary key,
  clerk_id    text unique not null,
  email       text unique not null,
  name        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (clerk_id = auth.uid()::text);

create policy "Users can update own profile"
  on public.profiles for update
  using (clerk_id = auth.uid()::text);
