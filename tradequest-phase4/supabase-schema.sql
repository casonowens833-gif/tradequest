-- TradeQuest Phase 3 Supabase schema
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Rookie',
  xp integer not null default 0,
  coins integer not null default 100,
  streak integer not null default 1,
  pro boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.lesson_progress (
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);
create table if not exists public.paper_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cash numeric not null default 10000
);
create table if not exists public.paper_positions (
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  qty numeric not null default 0,
  avg_cost numeric not null default 0,
  primary key(user_id,symbol)
);
create table if not exists public.paper_trades (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  side text not null check(side in ('BUY','SELL')),
  symbol text not null,
  qty numeric not null check(qty > 0),
  fill_price numeric not null check(fill_price > 0),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.paper_accounts enable row level security;
alter table public.paper_positions enable row level security;
alter table public.paper_trades enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid()=id) with check(auth.uid()=id);
create policy "own lessons" on public.lesson_progress for all using (auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own paper account" on public.paper_accounts for all using (auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own positions" on public.paper_positions for all using (auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own trades" on public.paper_trades for all using (auth.uid()=user_id) with check(auth.uid()=user_id);
