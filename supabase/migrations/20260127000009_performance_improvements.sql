-- Migration: Performance Improvements and Robust Pause Handling
-- Fixes fragile pause parsing and improves analytics query performance

-- ============================================
-- Part 1: Add dedicated paused_until column
-- ============================================

-- Add paused_until column for explicit pause expiration (instead of parsing text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ;

-- Create index for pause expiration queries
CREATE INDEX IF NOT EXISTS idx_profiles_paused_until
  ON profiles(paused_until)
  WHERE paused_until IS NOT NULL;

-- Update existing temporarily paused users to have proper paused_until value
-- This handles legacy data that used text-based pause tracking
UPDATE profiles
SET paused_until = suspended_at + (
  (substring(suspension_reason FROM '(\d+)\s*hours?')::INTEGER) * INTERVAL '1 hour'
)
WHERE is_suspended = true
  AND suspension_reason LIKE '%hour%'
  AND suspended_at IS NOT NULL
  AND paused_until IS NULL;

-- ============================================
-- Part 2: Improved is_user_active function
-- ============================================

-- Replace the fragile text-parsing function with a robust version
CREATE OR REPLACE FUNCTION is_user_active(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_suspended BOOLEAN;
  user_paused_until TIMESTAMPTZ;
BEGIN
  -- Get suspension status
  SELECT is_suspended, paused_until
  INTO user_suspended, user_paused_until
  FROM profiles
  WHERE id = check_user_id;

  -- User not found or not suspended
  IF user_suspended IS NULL OR user_suspended = false THEN
    RETURN true;
  END IF;

  -- Check if temporary pause has expired
  IF user_paused_until IS NOT NULL AND NOW() >= user_paused_until THEN
    -- Auto-unsuspend: pause period has expired
    UPDATE profiles
    SET is_suspended = false,
        suspension_reason = NULL,
        suspended_at = NULL,
        paused_until = NULL
    WHERE id = check_user_id;
    RETURN true;
  END IF;

  -- User is suspended (either permanently or pause not yet expired)
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_user_active IS 'Checks if user is active. Uses paused_until column for reliable pause expiration. Auto-unsuspends when pause expires.';

-- ============================================
-- Part 3: Analytics Performance Improvements
-- ============================================

-- Add indexes to speed up date-based analytics queries
CREATE INDEX IF NOT EXISTS idx_analyses_created_date
  ON analyses(DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_analyses_user_created
  ON analyses(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_drill_completions_completed_date
  ON drill_completions(DATE(completed_at));

CREATE INDEX IF NOT EXISTS idx_drill_completions_user_completed
  ON drill_completions(user_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp_date
  ON analytics_events(DATE(timestamp));

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp
  ON analytics_events(user_id, timestamp);

-- Add index for new signups query
CREATE INDEX IF NOT EXISTS idx_profiles_created_date
  ON profiles(DATE(created_at));

-- ============================================
-- Part 4: Optimized Daily Metrics Function
-- ============================================

-- Replace with more efficient metrics calculation using pre-computed activity
CREATE OR REPLACE FUNCTION calculate_daily_metrics()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  month_ago DATE := CURRENT_DATE - INTERVAL '30 days';
  v_total_users INTEGER;
  v_dau INTEGER;
  v_wau INTEGER;
  v_mau INTEGER;
  v_new_signups INTEGER;
  v_total_analyses INTEGER;
  v_total_drills INTEGER;
  v_premium_users INTEGER;
  v_avg_session NUMERIC;
BEGIN
  -- Calculate metrics with indexed queries

  -- Total active users (not suspended)
  SELECT COUNT(*) INTO v_total_users
  FROM profiles
  WHERE NOT COALESCE(is_suspended, false);

  -- New signups today
  SELECT COUNT(*) INTO v_new_signups
  FROM profiles
  WHERE DATE(created_at) = today;

  -- Total analyses and drills (running totals)
  SELECT COUNT(*) INTO v_total_analyses FROM analyses;
  SELECT COUNT(*) INTO v_total_drills FROM drill_completions;

  -- DAU: Use a single query with CASE to avoid multiple table scans
  WITH daily_active AS (
    SELECT DISTINCT user_id
    FROM analyses
    WHERE DATE(created_at) = today
    UNION
    SELECT DISTINCT user_id
    FROM drill_completions
    WHERE DATE(completed_at) = today
    UNION
    SELECT DISTINCT user_id
    FROM analytics_events
    WHERE DATE(timestamp) = today
  )
  SELECT COUNT(*) INTO v_dau FROM daily_active;

  -- WAU: Weekly active users
  WITH weekly_active AS (
    SELECT DISTINCT user_id
    FROM analyses
    WHERE created_at >= week_ago
    UNION
    SELECT DISTINCT user_id
    FROM drill_completions
    WHERE completed_at >= week_ago
    UNION
    SELECT DISTINCT user_id
    FROM analytics_events
    WHERE timestamp >= week_ago
  )
  SELECT COUNT(*) INTO v_wau FROM weekly_active;

  -- MAU: Monthly active users
  WITH monthly_active AS (
    SELECT DISTINCT user_id
    FROM analyses
    WHERE created_at >= month_ago
    UNION
    SELECT DISTINCT user_id
    FROM drill_completions
    WHERE completed_at >= month_ago
    UNION
    SELECT DISTINCT user_id
    FROM analytics_events
    WHERE timestamp >= month_ago
  )
  SELECT COUNT(*) INTO v_mau FROM monthly_active;

  -- Premium users from revenue_events (if table exists)
  BEGIN
    SELECT COUNT(DISTINCT user_id) INTO v_premium_users
    FROM revenue_events
    WHERE event_type = 'purchase'
      AND expiration_date > NOW();
  EXCEPTION
    WHEN undefined_table THEN
      v_premium_users := 0;
  END;

  -- Average session duration from user_sessions (if table exists)
  BEGIN
    SELECT COALESCE(AVG(session_duration_seconds), 0) INTO v_avg_session
    FROM user_sessions
    WHERE DATE(session_start) = today;
  EXCEPTION
    WHEN undefined_table THEN
      v_avg_session := 0;
  END;

  -- Insert or update metrics
  INSERT INTO app_metrics (
    metric_date,
    total_users,
    active_users_daily,
    active_users_weekly,
    active_users_monthly,
    new_signups,
    total_analyses,
    total_drills_completed,
    premium_users,
    avg_session_duration
  )
  VALUES (
    today,
    v_total_users,
    v_dau,
    v_wau,
    v_mau,
    v_new_signups,
    v_total_analyses,
    v_total_drills,
    v_premium_users,
    v_avg_session
  )
  ON CONFLICT (metric_date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users_daily = EXCLUDED.active_users_daily,
    active_users_weekly = EXCLUDED.active_users_weekly,
    active_users_monthly = EXCLUDED.active_users_monthly,
    new_signups = EXCLUDED.new_signups,
    total_analyses = EXCLUDED.total_analyses,
    total_drills_completed = EXCLUDED.total_drills_completed,
    premium_users = EXCLUDED.premium_users,
    avg_session_duration = EXCLUDED.avg_session_duration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Part 5: Optimized Retention Metrics
-- ============================================

-- More efficient retention calculation using materialized date ranges
CREATE OR REPLACE FUNCTION calculate_retention_metrics()
RETURNS void AS $$
DECLARE
  v_prev_month_start DATE := CURRENT_DATE - INTERVAL '60 days';
  v_prev_month_end DATE := CURRENT_DATE - INTERVAL '30 days';
  v_current_month_start DATE := CURRENT_DATE - INTERVAL '30 days';
  v_prev_month_users INTEGER;
  v_churned_users INTEGER;
  v_churn_rate NUMERIC;
BEGIN
  -- Get users active in previous month
  WITH prev_month_active AS (
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM analyses
      WHERE created_at >= v_prev_month_start AND created_at < v_prev_month_end
      UNION
      SELECT user_id FROM drill_completions
      WHERE completed_at >= v_prev_month_start AND completed_at < v_prev_month_end
    ) combined
  ),
  -- Get users active in current month
  current_month_active AS (
    SELECT DISTINCT user_id
    FROM (
      SELECT user_id FROM analyses
      WHERE created_at >= v_current_month_start
      UNION
      SELECT user_id FROM drill_completions
      WHERE completed_at >= v_current_month_start
    ) combined
  )
  -- Calculate churn
  SELECT
    COUNT(*) FILTER (WHERE pm.user_id IS NOT NULL),
    COUNT(*) FILTER (WHERE pm.user_id IS NOT NULL AND cm.user_id IS NULL)
  INTO v_prev_month_users, v_churned_users
  FROM prev_month_active pm
  LEFT JOIN current_month_active cm ON pm.user_id = cm.user_id;

  -- Calculate churn rate
  v_churn_rate := CASE
    WHEN v_prev_month_users > 0
    THEN 100.0 * v_churned_users / v_prev_month_users
    ELSE 0
  END;

  -- Update metrics
  INSERT INTO app_metrics (metric_date, churn_rate)
  VALUES (CURRENT_DATE, v_churn_rate)
  ON CONFLICT (metric_date) DO UPDATE SET
    churn_rate = EXCLUDED.churn_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_daily_metrics IS 'Calculates daily app metrics with optimized queries using indexes';
COMMENT ON FUNCTION calculate_retention_metrics IS 'Calculates monthly churn rate with efficient JOIN-based approach';
