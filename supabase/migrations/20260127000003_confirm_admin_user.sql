-- Confirm admin user for App Store demo/screenshots
-- This directly confirms the email for the demo account

UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'guampaul@gmail.com'
  AND email_confirmed_at IS NULL;
