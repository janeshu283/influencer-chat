-- Add missing columns if they don't exist
ALTER TABLE chat_rooms
ADD COLUMN IF NOT EXISTS last_message TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update or create RLS policies
DROP POLICY IF EXISTS "Users can view their own chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON chat_rooms;

CREATE POLICY "Users can view their own chat rooms"
ON chat_rooms FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    auth.uid() = influencer_id
);

CREATE POLICY "Users can create chat rooms"
ON chat_rooms FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "Users can update their own chat rooms"
ON chat_rooms FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR 
    auth.uid() = influencer_id
);
