import { User } from '@supabase/supabase-js'

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
  is_influencer?: boolean
  is_admin?: boolean
  is_active?: boolean
  profile_image_url?: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
      }
      chat_rooms: {
        Row: ChatRoom
      }
      messages: {
        Row: Message
      }
    }
  }
}

export interface OnlineStatus {
  user_id: string
  online_at: string
  status: 'online' | 'offline'
}

export interface Tip {
  id: string
  created_at: string
  amount: number
  from_user_id: string
  to_user_id: string
  message?: string
}

export interface ChatRoom {
  id: string
  created_at: string
  user_id: string
  influencer_id: string
  name?: string
  description?: string
  is_active?: boolean
  last_message?: string
  last_message_time?: string
  user?: Profile
  influencer?: Profile
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
