'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Session, User } from '@supabase/supabase-js'

type UserProfile = {
  nickname: string
  userId: string
  instagram: string
  x?: string
  tiktok?: string
  profileImage?: File | null
}

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, profile?: UserProfile) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 初期セッションの取得
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Failed to get session:', error)
        setLoading(false)
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(error => {
      console.error('Failed to get session:', error)
      setLoading(false)
    })

    // セッション変更のリスナー
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      router.push('/chat')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, profile?: any) => {
    try {
      // First check if the user already exists
      const { data: existingUserData } = await supabase.auth.signInWithPassword({
        email,
        password,
      }).catch(() => ({ data: null })); // Catch and ignore auth errors
      
      // If user exists and login was successful, handle as returning user
      if (existingUserData?.user) {
        console.log('User already exists, updating profile...');
        
        // User exists and password is correct, update their profile
        if (profile) {
          const isInfluencer = profile.isInfluencer === undefined ? false : profile.isInfluencer;
          console.log('Updating profile with isInfluencer:', isInfluencer);
          
          // Handle profile image upload if provided for existing users
          let profileImageUrl = null;
          if (profile.profileImage) {
            try {
              const file = profile.profileImage;
              const fileExt = file.name.split('.').pop();
              const fileName = `${existingUserData.user.id}-${Date.now()}.${fileExt}`;
              const filePath = `avatars/${fileName}`;

              console.log('Uploading profile image for existing user:', filePath);
              const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

              if (uploadError) {
                console.error('Error uploading profile image for existing user:', uploadError);
              } else {
                const { data: { publicUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(filePath);
                
                profileImageUrl = publicUrl;
                console.log('Profile image uploaded successfully for existing user:', publicUrl);
              }
            } catch (uploadError) {
              console.error('Profile image upload error for existing user:', uploadError);
              // Continue with profile update even if image upload fails
            }
          }
          
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: existingUserData.user.id,
                email: email,
                nickname: profile.nickname,
                instagram: profile.instagram,
                x: profile.x,
                tiktok: profile.tiktok,
                is_influencer: isInfluencer,
                // Add profile image URL if available
                ...(profileImageUrl && { profile_image_url: profileImageUrl }),
                // Removed user_id field as it doesn't exist in the profiles table
              }, { onConflict: 'id' });

            if (profileError) {
              console.error('Profile update error details:', JSON.stringify(profileError));
              throw new Error(`Profile update failed: ${profileError.message || 'Unknown error'}`);
            }
          } catch (profileUpdateError) {
            console.error('Profile update error:', profileUpdateError);
            throw profileUpdateError;
          }
        }
        
        // Redirect to influencers page for existing users
        router.push('/influencers');
        return;
      }
      
      // If user doesn't exist or password is incorrect, proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // If the error is 'User already registered', it means the email exists but password was wrong
        if (error.message.includes('already registered')) {
          throw new Error('このメールアドレスは既に登録されています。別のメールアドレスを使用するか、ログインしてください。');
        }
        throw error;
      }

      if (data.user && profile) {
        // Ensure we're using the correct property name for is_influencer
        const isInfluencer = profile.isInfluencer === undefined ? false : profile.isInfluencer;
        console.log('Creating profile with isInfluencer:', isInfluencer);
        
        // Handle profile image upload if provided
        let profileImageUrl = null;
        if (profile.profileImage) {
          try {
            const file = profile.profileImage;
            const fileExt = file.name.split('.').pop();
            const fileName = `${data.user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            console.log('Uploading profile image:', filePath);
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, file);

            if (uploadError) {
              console.error('Error uploading profile image:', uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
              
              profileImageUrl = publicUrl;
              console.log('Profile image uploaded successfully:', publicUrl);
            }
          } catch (uploadError) {
            console.error('Profile image upload error:', uploadError);
            // Continue with profile creation even if image upload fails
          }
        }
        
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email,
              nickname: profile.nickname,
              instagram: profile.instagram,
              x: profile.x,
              tiktok: profile.tiktok,
              is_influencer: isInfluencer,
              // Add profile image URL if available
              ...(profileImageUrl && { profile_image_url: profileImageUrl }),
              // Removed user_id field as it doesn't exist in the profiles table
            }, { onConflict: 'id' });

          if (profileError) {
            console.error('Profile creation error details:', JSON.stringify(profileError));
            throw new Error(`Profile creation failed: ${profileError.message || 'Unknown error'}`);
          }
        } catch (profileCreateError) {
          console.error('Profile creation error:', profileCreateError);
          throw profileCreateError;
        }
      }
      
      // サインアップ後は確認メールを送信するため、メッセージを表示
      router.push('/auth/verify');
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  const signOut = async () => {
    try {
      // Check if there's an active session first
      const { data: sessionData } = await supabase.auth.getSession();
      
      // If no session exists, just redirect to home without trying to sign out
      if (!sessionData.session) {
        console.log('No active session found, redirecting to home');
        setSession(null);
        setUser(null);
        router.push('/');
        return;
      }
      
      // If we have a session, proceed with sign out
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to redirect to home and clear local state
      setSession(null);
      setUser(null);
      router.push('/');
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}