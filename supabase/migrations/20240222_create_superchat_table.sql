create table public.superchat (
  id uuid default gen_random_uuid() primary key,
  influencer_id uuid references public.profiles(id) not null,
  user_id uuid references auth.users(id) not null,
  amount integer not null,
  message text,
  payment_status text not null,
  stripe_session_id text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSポリシーの設定
alter table public.superchat enable row level security;

-- インフルエンサーは自分宛のスーパーチャットを閲覧可能
create policy "Influencers can view their received superchats"
  on public.superchat for select
  using (auth.uid() = influencer_id);

-- ユーザーは自分が送信したスーパーチャットを閲覧可能
create policy "Users can view their sent superchats"
  on public.superchat for select
  using (auth.uid() = user_id);
