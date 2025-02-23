-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
DROP POLICY IF EXISTS "Chat participants can view messages" ON messages;
DROP POLICY IF EXISTS "Chat participants can insert messages" ON messages;

CREATE POLICY "Chat participants can view messages"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = messages.chat_room_id
        AND (auth.uid() = chat_rooms.user_id OR auth.uid() = chat_rooms.influencer_id)
    )
);

CREATE POLICY "Chat participants can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = messages.chat_room_id
        AND (auth.uid() = chat_rooms.user_id OR auth.uid() = chat_rooms.influencer_id)
    )
);
