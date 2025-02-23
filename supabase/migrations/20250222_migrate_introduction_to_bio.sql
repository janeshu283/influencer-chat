-- Migrate data from introduction to bio
UPDATE profiles 
SET bio = introduction 
WHERE introduction IS NOT NULL AND bio IS NULL;

-- After confirming the migration is successful, you can optionally drop the introduction column
-- ALTER TABLE profiles DROP COLUMN introduction;
