-- Admin Security Enhancements
-- Password rotation tracking and enhanced audit logging

-- Add password tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

-- Update existing admin to have password expiry set
UPDATE profiles 
SET password_changed_at = created_at,
    password_expires_at = created_at + INTERVAL '6 months'
WHERE role IN ('admin', 'super_admin') AND password_changed_at IS NULL;

-- Admin login log (separate from audit for security)
CREATE TABLE IF NOT EXISTS admin_login_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login_success', 'login_failed', 'logout', 'password_changed'
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_admin ON admin_login_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_created ON admin_login_log(created_at DESC);

-- RLS for admin login log
ALTER TABLE admin_login_log ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view all login logs
CREATE POLICY "Super admin can view all login logs"
  ON admin_login_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Admins can view their own login logs
CREATE POLICY "Admins can view own login logs"
  ON admin_login_log FOR SELECT
  TO authenticated
  USING (admin_id = auth.uid());

-- Service role can insert
CREATE POLICY "Service role manages login logs"
  ON admin_login_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to log admin login
CREATE OR REPLACE FUNCTION log_admin_login(
  p_admin_id UUID,
  p_action TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_login_log (admin_id, action, ip_address, user_agent, session_id)
  VALUES (p_admin_id, p_action, p_ip_address, p_user_agent, p_session_id);
  
  -- Update last login if successful
  IF p_action = 'login_success' THEN
    UPDATE profiles 
    SET last_login_at = NOW(), 
        last_login_ip = p_ip_address,
        failed_login_attempts = 0
    WHERE id = p_admin_id;
  END IF;
  
  -- Track failed attempts
  IF p_action = 'login_failed' THEN
    UPDATE profiles 
    SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
        locked_until = CASE 
          WHEN COALESCE(failed_login_attempts, 0) >= 4 THEN NOW() + INTERVAL '15 minutes'
          ELSE locked_until
        END
    WHERE id = p_admin_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if admin password needs rotation
CREATE OR REPLACE FUNCTION check_admin_password_expiry(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT password_expires_at INTO v_expires_at
  FROM profiles
  WHERE id = p_user_id AND role IN ('admin', 'super_admin');
  
  IF v_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update password changed date (call after password change)
CREATE OR REPLACE FUNCTION update_admin_password_changed(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET password_changed_at = NOW(),
      password_expires_at = NOW() + INTERVAL '6 months'
  WHERE id = p_user_id AND role IN ('admin', 'super_admin');
  
  -- Log password change
  PERFORM log_admin_login(p_user_id, 'password_changed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can be modified by admin
CREATE OR REPLACE FUNCTION can_admin_modify_user(p_admin_id UUID, p_target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role TEXT;
  v_target_role TEXT;
BEGIN
  -- Get admin's role
  SELECT role INTO v_admin_role FROM profiles WHERE id = p_admin_id;
  
  -- Get target's role
  SELECT role INTO v_target_role FROM profiles WHERE id = p_target_user_id;
  
  -- Super admin can modify anyone except themselves for deletion
  IF v_admin_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Regular admin can only modify regular users
  IF v_admin_role = 'admin' THEN
    RETURN v_target_role = 'user';
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
