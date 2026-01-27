-- Admin System for BoxCoach AI
-- Adds admin roles, user management, and analytics tracking

-- Add admin role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_target_user ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_log(created_at DESC);

-- RLS for admin audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- User violations/reports table
CREATE TABLE IF NOT EXISTS user_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id),
  violation_type TEXT NOT NULL CHECK (violation_type IN ('inappropriate_content', 'spam', 'abuse', 'terms_violation', 'other')),
  description TEXT,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_user ON user_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON user_violations(status);

-- RLS for violations
ALTER TABLE user_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage violations"
  ON user_violations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- App metrics table for investor reports
CREATE TABLE IF NOT EXISTS app_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users_daily INTEGER DEFAULT 0,
  active_users_weekly INTEGER DEFAULT 0,
  active_users_monthly INTEGER DEFAULT 0,
  new_signups INTEGER DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  total_drills_completed INTEGER DEFAULT 0,
  premium_users INTEGER DEFAULT 0,
  revenue_mrr DECIMAL(10,2) DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(metric_date)
);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON app_metrics(metric_date DESC);

-- RLS for metrics
ALTER TABLE app_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view metrics"
  ON app_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Service role can manage metrics"
  ON app_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to calculate daily metrics
CREATE OR REPLACE FUNCTION calculate_daily_metrics()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  INSERT INTO app_metrics (metric_date, total_users, new_signups, total_analyses, total_drills_completed)
  SELECT 
    today,
    (SELECT COUNT(*) FROM profiles),
    (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = today),
    (SELECT COUNT(*) FROM analyses),
    (SELECT COUNT(*) FROM drill_completions)
  ON CONFLICT (metric_date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_signups = EXCLUDED.new_signups,
    total_analyses = EXCLUDED.total_analyses,
    total_drills_completed = EXCLUDED.total_drills_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set guampaul@gmail.com as super_admin
UPDATE profiles SET role = 'super_admin' WHERE email = 'guampaul@gmail.com';

-- Grant service role full access to new tables
CREATE POLICY "Service role can manage audit logs"
  ON admin_audit_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage violations"
  ON user_violations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
