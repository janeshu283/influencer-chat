-- 既存のテーブルがあれば削除
DROP TABLE IF EXISTS super_chats;

-- シンプルなsuper_chatsテーブルを作成
CREATE TABLE IF NOT EXISTS super_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  influencer_id UUID REFERENCES profiles(id),
  room_id UUID REFERENCES chat_rooms(id),
  amount INTEGER NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS super_chats_user_id_idx ON super_chats(user_id);
CREATE INDEX IF NOT EXISTS super_chats_influencer_id_idx ON super_chats(influencer_id);
CREATE INDEX IF NOT EXISTS super_chats_room_id_idx ON super_chats(room_id);
CREATE INDEX IF NOT EXISTS super_chats_stripe_session_id_idx ON super_chats(stripe_session_id);

-- RLSは一時的に無効化（テスト後に有効化する）
ALTER TABLE super_chats DISABLE ROW LEVEL SECURITY;
