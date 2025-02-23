-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  is_influencer boolean default false,
  is_admin boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat_rooms table
create table if not exists chat_rooms (
  id uuid default uuid_generate_v4() primary key,
  influencer_id uuid references profiles(id) not null,
  user_id uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(influencer_id, user_id)
);

-- Create messages table
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  chat_room_id uuid references chat_rooms(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tips table
create table if not exists tips (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  amount integer not null,
  chat_room_id uuid references chat_rooms(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create online_status table
create table if not exists online_status (
  id uuid references profiles(id) on delete cascade primary key,
  last_seen timestamp with time zone default timezone('utc'::text, now()) not null,
  is_online boolean default false
);

-- Set up row level security (RLS)
alter table profiles enable row level security;
alter table chat_rooms enable row level security;
alter table messages enable row level security;
alter table tips enable row level security;
alter table online_status enable row level security;

-- Create policies
-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Chat rooms policies
create policy "Chat participants can view their rooms"
  on chat_rooms for select
  using (auth.uid() = user_id or auth.uid() = influencer_id);

create policy "Users can create chat rooms with influencers"
  on chat_rooms for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from profiles
      where id = influencer_id
      and is_influencer = true
    )
  );

-- Messages policies
create policy "Chat participants can view messages"
  on messages for select
  using (
    exists (
      select 1 from chat_rooms
      where id = chat_room_id
      and (user_id = auth.uid() or influencer_id = auth.uid())
    )
  );

create policy "Chat participants can insert messages"
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from chat_rooms
      where id = chat_room_id
      and (user_id = auth.uid() or influencer_id = auth.uid())
    )
  );

-- Tips policies
create policy "Users can view their tips"
  on tips for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send tips"
  on tips for insert
  with check (auth.uid() = sender_id);

-- Online status policies
create policy "Online status is viewable by everyone"
  on online_status for select
  using (true);

create policy "Users can update their online status"
  on online_status for update
  using (auth.uid() = id);

-- Functions and triggers
-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'avatar_url');
  
  insert into public.online_status (id, is_online)
  values (new.id, false);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
