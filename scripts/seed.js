const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
dotenv.config()

const supabase = createClient(
  'https://bjmtpjrtpfxvchtdapuj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbXRwanJ0cGZ4dmNodGRhcHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3ODY3NTQsImV4cCI6MjA1NTM2Mjc1NH0.7Aefh9YhlMLF7JCDrRYNEZ6hmurPbIzrKfaDXz3T8MU'
)

const dummyInfluencers = [
  {
    nickname: 'Sakura',
    email: 'sakura@example.com',
    user_id: null,
    instagram: 'sakura_beauty',
    twitter: 'sakura_fashion',
    tiktok: 'sakura_lifestyle',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    introduction: 'ビューティー＆ファッションクリエイター。毎日のメイクやコーディネートのコツを発信しています！',
    is_influencer: true
  },
  {
    nickname: 'Yuki',
    email: 'yuki@example.com',
    user_id: null,
    instagram: 'yuki_travel',
    twitter: 'yuki_journey',
    tiktok: 'yuki_adventure',
    profile_image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop',
    introduction: '世界中を旅するトラベルクリエイター。素敵な場所や美味しいグルメ情報を紹介します✈️🌎',
    is_influencer: true
  },
  {
    nickname: 'Haru',
    email: 'haru@example.com',
    user_id: null,
    instagram: 'haru_fitness',
    twitter: 'haru_health',
    tiktok: 'haru_workout',
    profile_image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
    introduction: 'フィットネストレーナー。健康的な生活とワークアウトのモチベーションをお届け！💪',
    is_influencer: true
  }
]

async function seedInfluencers() {
  for (const influencer of dummyInfluencers) {
    try {
      // ユーザーを作成
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: influencer.email,
        password: 'password123'
      })

      if (userError) {
        console.error('Error creating user:', userError)
        continue
      }

      // プロフィールを作成
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: userData.user?.id,
          nickname: influencer.nickname,
          instagram: influencer.instagram,
          twitter: influencer.twitter,
          tiktok: influencer.tiktok,
          profile_image_url: influencer.profile_image_url,
          introduction: influencer.introduction,
          is_influencer: influencer.is_influencer
        }], { onConflict: 'id' })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        continue
      }

      console.log(`Created influencer: ${influencer.nickname}`)
    } catch (error) {
      console.error(`Error processing influencer ${influencer.nickname}:`, error)
    }
  }
}

seedInfluencers()
  .catch(console.error)
  .finally(() => process.exit(0))
