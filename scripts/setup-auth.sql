-- Disable email confirmation requirement in Supabase
-- This script provides instructions for disabling email confirmation

-- IMPORTANT: Run these commands in your Supabase SQL Editor or via Supabase Dashboard

-- 1. Disable email confirmation requirement
-- Go to Supabase Dashboard > Authentication > Settings
-- Set "Enable email confirmations" to OFF

-- 2. If you want to do it via SQL, you need to update auth.config
-- Note: This requires superuser access and may not work in all Supabase setups

-- Alternative: Use this policy to allow unconfirmed users
CREATE POLICY "Allow unconfirmed email access" ON auth.users
  FOR SELECT
  USING (true);

-- 3. Update existing users to set email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. Create a function to auto-confirm new users (trigger-based approach)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called by a trigger on auth.users
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
    NEW.confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Creating triggers on auth.users requires superuser privileges
-- You should disable email confirmation in Supabase Dashboard instead
