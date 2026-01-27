-- Acquisition-Ready Analytics Schema
-- Captures all metrics required for due diligence and investor reporting

-- User cohorts table for retention analysis
CREATE TABLE IF NOT EXISTS user_cohorts (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  signup_date DATE NOT NULL,
  signup_week DATE NOT NULL,  -- First day of signup week
  signup_month DATE NOT NULL, -- First day of signup month
  first_analysis_date DATE,
  first_drill_date DATE,
  first_premium_date DATE,
  acquisition_source TEXT DEFAULT 'organic',
  device_type TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_signup_week ON user_cohorts(signup_week);
CREATE INDEX IF NOT EXISTS idx_cohorts_signup_month ON user_cohorts(signup_month);

-- Revenue tracking table (sync from RevenueCat webhooks)
CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'purchase', 'renewal', 'cancellation', 'refund'
  product_id TEXT NOT NULL,
  revenue_usd DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_id TEXT UNIQUE,
  platform TEXT, -- 'ios', 'android'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_user ON revenue_events(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_events(created_at DESC);

-- Feature usage tracking (for product-market fit analysis)
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB,
  UNIQUE(user_id, feature_name, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_feature_user ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_date ON feature_usage(usage_date DESC);

-- Session tracking for engagement metrics
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  screens_viewed INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  device_info JSONB,
  app_version TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON user_sessions(session_start DESC);

-- RLS Policies
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own cohort data"
  ON user_cohorts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own revenue"
  ON revenue_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own feature usage"
  ON feature_usage FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON user_sessions FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service role manages cohorts"
  ON user_cohorts FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages revenue"
  ON revenue_events FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages feature usage"
  ON feature_usage FOR ALL TO service_role USING (true);

CREATE POLICY "Service role manages sessions"
  ON user_sessions FOR ALL TO service_role USING (true);

-- Admins can view all for reporting
CREATE POLICY "Admins view cohorts"
  ON user_cohorts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins view revenue"
  ON revenue_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins view feature usage"
  ON feature_usage FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Admins view sessions"
  ON user_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Function to auto-create cohort entry on user signup
CREATE OR REPLACE FUNCTION create_user_cohort()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_cohorts (user_id, signup_date, signup_week, signup_month)
  VALUES (
    NEW.id,
    CURRENT_DATE,
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    DATE_TRUNC('month', CURRENT_DATE)::DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create cohort on profile creation
DROP TRIGGER IF EXISTS on_profile_created_cohort ON profiles;
CREATE TRIGGER on_profile_created_cohort
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_cohort();

-- Function to track feature usage (upsert)
CREATE OR REPLACE FUNCTION track_feature_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO feature_usage (user_id, feature_name, usage_count, metadata)
  VALUES (p_user_id, p_feature, 1, p_metadata)
  ON CONFLICT (user_id, feature_name, usage_date)
  DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    metadata = COALESCE(EXCLUDED.metadata, feature_usage.metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive investor metrics view
CREATE OR REPLACE VIEW investor_metrics AS
SELECT
  m.metric_date,
  m.total_users,
  m.active_users_daily AS dau,
  m.active_users_weekly AS wau,
  m.active_users_monthly AS mau,
  m.new_signups,
  -- DAU/MAU ratio (engagement indicator)
  CASE WHEN m.active_users_monthly > 0 
    THEN ROUND(100.0 * m.active_users_daily / m.active_users_monthly, 1)
    ELSE 0 
  END AS dau_mau_ratio,
  m.total_analyses,
  m.total_drills_completed,
  m.churn_rate,
  -- Revenue metrics (from revenue_events)
  COALESCE((
    SELECT SUM(revenue_usd) 
    FROM revenue_events 
    WHERE DATE(created_at) = m.metric_date
  ), 0) AS daily_revenue,
  COALESCE((
    SELECT SUM(revenue_usd) 
    FROM revenue_events 
    WHERE created_at >= DATE_TRUNC('month', m.metric_date::timestamp)
  ), 0) AS mtd_revenue
FROM app_metrics m
ORDER BY m.metric_date DESC;

-- Grant access to investor metrics view
GRANT SELECT ON investor_metrics TO authenticated;
