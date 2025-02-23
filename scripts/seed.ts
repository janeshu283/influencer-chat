import { supabase } from '../src/lib/supabase/client'

const dummyInfluencers = [
  {
    nickname: 'Sakura',
    email: 'sakura@example.com',
    instagram: 'sakura_beauty',
    twitter: 'sakura_fashion',
    tiktok: 'sakura_lifestyle',
    profile_image_url: 'https://source.unsplash.com/random/200x200?portrait=1',
    bio: 'ビューティー＆ファッションクリエイター。毎日のメイクやコーディネートのコツを発信しています！',
    is_influencer: true
  },
  {
    nickname: 'Yuki',
    email: 'yuki@example.com',
    instagram: 'yuki_travel',
    twitter: 'yuki_journey',
    tiktok: 'yuki_adventure',
    profile_image_url: 'https://source.unsplash.com/random/200x200?portrait=2',
    bio: '世界中を旅するトラベルクリエイター。素敵な場所や美味しいグルメ情報を紹介します✈️🌎',
    is_influencer: true
  },
  {
    nickname: 'Haru',
    email: 'haru@example.com',
    instagram: 'haru_fitness',
    twitter: 'haru_health',
    tiktok: 'haru_workout',
    profile_image_url: 'https://source.unsplash.com/random/200x200?portrait=3',
    bio: 'フィットネストレーナー。健康的な生活とワークアウトのモチベーションをお届け！💪',
    is_influencer: true
  }
]

async function seedInfluencers() {
  for (const influencer of dummyInfluencers) {
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
      .insert([{
        id: userData.user?.id,
        ...influencer
      }])

    if (profileError) {
      console.error('Error creating profile:', profileError)
      continue
    }

    console.log(`Created influencer: ${influencer.nickname}`)
  }
}

seedInfluencers()
  .catch(console.error)
  .finally(() => process.exit(0))
