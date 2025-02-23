-- Drop existing chat_rooms table if it exists
DROP TABLE IF EXISTS chat_rooms;

-- Create chat_rooms table
CREATE TABLE chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    influencer_id UUID REFERENCES profiles(id),
    user_id UUID REFERENCES profiles(id),
    last_message TEXT DEFAULT '',
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(influencer_id, user_id)
);

-- Create RLS policies
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own chat rooms
CREATE POLICY "Users can view their own chat rooms"
ON chat_rooms FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    auth.uid() = influencer_id
);

-- Allow users to create chat rooms
CREATE POLICY "Users can create chat rooms"
ON chat_rooms FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);

-- Allow users to update their own chat rooms
CREATE POLICY "Users can update their own chat rooms"
ON chat_rooms FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR 
    auth.uid() = influencer_id
);
