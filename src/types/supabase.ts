export interface Profile {
  id: string
  created_at?: string
  updated_at?: string
  username?: string
  full_name?: string
  avatar_url?: string
  website?: string
  email?: string
  role?: 'user' | 'influencer' | 'admin'
  nickname?: string
  bio?: string
}

export interface ChatRoom {
  id: string
  created_at: string
  influencer_id: string
  name: string
  description?: string
  is_active: boolean
}

export interface Message {
  id: string
  created_at: string
  chat_room_id: string
  user_id: string
  content: string
  type?: 'text' | 'superchat'
  amount?: number
}
