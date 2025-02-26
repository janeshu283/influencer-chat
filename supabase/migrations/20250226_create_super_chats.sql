-- Create super_chats table
CREATE TABLE IF NOT EXISTS super_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS super_chats_user_id_idx ON super_chats(user_id);
CREATE INDEX IF NOT EXISTS super_chats_influencer_id_idx ON super_chats(influencer_id);
CREATE INDEX IF NOT EXISTS super_chats_room_id_idx ON super_chats(room_id);
CREATE INDEX IF NOT EXISTS super_chats_stripe_session_id_idx ON super_chats(stripe_session_id);

-- Set up Row Level Security
ALTER TABLE super_chats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own super chats"
  ON super_chats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Influencers can view super chats sent to them"
  ON super_chats
  FOR SELECT
  USING (auth.uid() = influencer_id);

CREATE POLICY "Users can create super chats"
  ON super_chats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update super chats"
  ON super_chats
  FOR UPDATE
  USING (true);
