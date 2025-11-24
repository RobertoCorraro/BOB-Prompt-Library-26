-- Create the prompts table
create table prompts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text not null, -- 'Psicologia', 'Marketing', 'Business', etc.
  type text not null, -- 'Prompt parziale', 'Prompt template', 'System Prompt', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table prompts enable row level security;

-- Create a policy that allows everyone to read prompts
create policy "Enable read access for all users" on prompts
  for select using (true);

-- Create a policy that allows authenticated users (or everyone if you prefer open access for this demo) to insert/update/delete
-- For this demo, we'll allow everyone to insert/update/delete to make the admin panel work without auth implementation details
create policy "Enable write access for all users" on prompts
  for insert with check (true);

create policy "Enable update access for all users" on prompts
  for update using (true);

create policy "Enable delete access for all users" on prompts
  for delete using (true);
