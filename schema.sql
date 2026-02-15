-- Create the prompts table
create table prompts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text not null, -- 'Psicologia', 'Marketing', 'Business', etc.
  type text not null, -- 'Prompt parziale', 'Prompt template', 'System Prompt', etc.
  is_favorite boolean default false,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table prompts enable row level security;

-- ==========================================================
-- 🛡️ SECURITY WARNING: DEMO POLICIES
-- The policies below are OPEN to facilitate testing and demo.
-- In a production environment, you should restrict access.
-- ==========================================================

-- 1. READ POLICY: Allows anyone to see prompts
create policy "Enable read access for all users" on prompts
  for select using (true);

-- 2. WRITE POLICIES: ⚠️ CAUTION
-- These allow anyone with the ANON_KEY to insert, update, or delete.
-- TO SECURE: Change 'with check (true)' to 'with check (auth.role() = 'authenticated')'
-- if you enable Supabase Auth.

create policy "Enable write access for all users" on prompts
  for insert with check (true);

create policy "Enable update access for all users" on prompts
  for update using (true);

create policy "Enable delete access for all users" on prompts
  for delete using (true);

-- 💡 PRODUCTION TIP:
-- If you want only the owner to see/edit their prompts, use:
-- for select using (auth.uid() = user_id);
-- (This requires adding a user_id column to the table)


-- Categories Table
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table categories enable row level security;

create policy "Enable read access for all users" on categories for select using (true);
create policy "Enable insert access for all users" on categories for insert with check (true);
create policy "Enable update access for all users" on categories for update using (true);
create policy "Enable delete access for all users" on categories for delete using (true);

-- Types Table
create table types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table types enable row level security;

create policy "Enable read access for all users" on types for select using (true);
create policy "Enable insert access for all users" on types for insert with check (true);
create policy "Enable update access for all users" on types for update using (true);
create policy "Enable delete access for all users" on types for delete using (true);

-- Prompt Tags Table
create table prompt_tags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table prompt_tags enable row level security;

create policy "Enable read access for all users" on prompt_tags for select using (true);
create policy "Enable insert access for all users" on prompt_tags for insert with check (true);
create policy "Enable update access for all users" on prompt_tags for update using (true);
create policy "Enable delete access for all users" on prompt_tags for delete using (true);

-- Insert default prompt tags
INSERT INTO prompt_tags (name) VALUES
  ('contesto'),
  ('istruzioni'),
  ('esempio'),
  ('output'),
  ('variabili')
ON CONFLICT (name) DO NOTHING;
