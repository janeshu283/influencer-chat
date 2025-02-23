-- Get user IDs
WITH user_ids AS (
  SELECT id, email FROM auth.users
  WHERE email IN ('sakura@example.com', 'yuki@example.com', 'haru@example.com')
)
-- Update profiles
UPDATE profiles
SET 
  nickname = CASE 
    WHEN u.email = 'sakura@example.com' THEN 'Sakura'
    WHEN u.email = 'yuki@example.com' THEN 'Yuki'
    WHEN u.email = 'haru@example.com' THEN 'Haru'
  END,
  instagram = CASE 
    WHEN u.email = 'sakura@example.com' THEN 'sakura_beauty'
    WHEN u.email = 'yuki@example.com' THEN 'yuki_travel'
    WHEN u.email = 'haru@example.com' THEN 'haru_fitness'
  END,
  twitter = CASE 
    WHEN u.email = 'sakura@example.com' THEN 'sakura_fashion'
    WHEN u.email = 'yuki@example.com' THEN 'yuki_journey'
    WHEN u.email = 'haru@example.com' THEN 'haru_health'
  END,
  tiktok = CASE 
    WHEN u.email = 'sakura@example.com' THEN 'sakura_lifestyle'
    WHEN u.email = 'yuki@example.com' THEN 'yuki_adventure'
    WHEN u.email = 'haru@example.com' THEN 'haru_workout'
  END,
  profile_image_url = CASE 
    WHEN u.email = 'sakura@example.com' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
    WHEN u.email = 'yuki@example.com' THEN 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop'
    WHEN u.email = 'haru@example.com' THEN 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop'
  END,
  introduction = CASE 
    WHEN u.email = 'sakura@example.com' THEN 'ビューティー＆ファッションクリエイター。毎日のメイクやコーディネートのコツを発信しています！'
    WHEN u.email = 'yuki@example.com' THEN '世界中を旅するトラベルクリエイター。素敵な場所や美味しいグルメ情報を紹介します✈️🌎'
    WHEN u.email = 'haru@example.com' THEN 'フィットネストレーナー。健康的な生活とワークアウトのモチベーションをお届け！💪'
  END,
  is_influencer = true
FROM user_ids u
WHERE profiles.id = u.id;
