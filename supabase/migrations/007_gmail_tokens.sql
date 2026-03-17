-- Add OAuth tokens to profiles for Gmail sending
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS gmail_access_token TEXT,
ADD COLUMN IF NOT EXISTS gmail_token_expires_at TIMESTAMPTZ;

-- Ensure service role can manage these columns securely
-- (Existing RLS on profiles already allows super_admins and service role)
