-- Delete all influencer profiles except the original three
DELETE FROM profiles
WHERE email NOT IN ('sakura@example.com', 'yuki@example.com', 'haru@example.com');

-- Delete all auth.users except the original three
DELETE FROM auth.users
WHERE email NOT IN ('sakura@example.com', 'yuki@example.com', 'haru@example.com');
