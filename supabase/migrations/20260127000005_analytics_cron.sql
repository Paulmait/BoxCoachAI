-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Enhanced daily metrics calculation with acquisition-ready data
CREATE OR REPLACE FUNCTION calculate_daily_metrics()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
  month_ago DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
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
  SELECT 
    today,
    -- Total users
    (SELECT COUNT(*) FROM profiles WHERE NOT is_suspended),
    -- DAU (users with any activity today)
    (SELECT COUNT(DISTINCT user_id) FROM (
      SELECT user_id FROM analyses WHERE DATE(created_at) = today
      UNION
      SELECT user_id FROM drill_completions WHERE DATE(completed_at) = today
      UNION
      SELECT user_id FROM analytics_events WHERE DATE(timestamp) = today
    ) active),
    -- WAU (users with activity in last 7 days)
    (SELECT COUNT(DISTINCT user_id) FROM (
      SELECT user_id FROM analyses WHERE created_at >= week_ago
      UNION
      SELECT user_id FROM drill_completions WHERE completed_at >= week_ago
      UNION
      SELECT user_id FROM analytics_events WHERE timestamp >= week_ago
    ) weekly),
    -- MAU (users with activity in last 30 days)
    (SELECT COUNT(DISTINCT user_id) FROM (
      SELECT user_id FROM analyses WHERE created_at >= month_ago
      UNION
      SELECT user_id FROM drill_completions WHERE completed_at >= month_ago
      UNION
      SELECT user_id FROM analytics_events WHERE timestamp >= month_ago
    ) monthly),
    -- New signups today
    (SELECT COUNT(*) FROM profiles WHERE DATE(created_at) = today),
    -- Total analyses
    (SELECT COUNT(*) FROM analyses),
    -- Total drills completed
    (SELECT COUNT(*) FROM drill_completions),
    -- Premium users (placeholder - connect to RevenueCat)
    0,
    -- Avg session duration (placeholder)
    0
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

-- Schedule daily metrics calculation at midnight UTC
SELECT cron.schedule(
  'calculate-daily-metrics',
  '0 0 * * *',  -- Every day at midnight
  'SELECT calculate_daily_metrics()'
);

-- Also run weekly retention calculation
CREATE OR REPLACE FUNCTION calculate_retention_metrics()
RETURNS void AS $$
BEGIN
  -- Calculate cohort retention (users who signed up in a given week and are still active)
  -- This is valuable for acquisition due diligence
  INSERT INTO app_metrics (
    metric_date,
    churn_rate
  )
  SELECT 
    CURRENT_DATE,
    -- Churn rate: users who were active last month but not this month
    COALESCE(
      100.0 * (
        SELECT COUNT(DISTINCT user_id) FROM (
          SELECT user_id FROM analyses WHERE created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days'
          UNION
          SELECT user_id FROM drill_completions WHERE completed_at >= CURRENT_DATE - INTERVAL '60 days' AND completed_at < CURRENT_DATE - INTERVAL '30 days'
        ) prev_month
        WHERE user_id NOT IN (
          SELECT user_id FROM analyses WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          UNION
          SELECT user_id FROM drill_completions WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days'
        )
      ) / NULLIF((
        SELECT COUNT(DISTINCT user_id) FROM (
          SELECT user_id FROM analyses WHERE created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days'
          UNION
          SELECT user_id FROM drill_completions WHERE completed_at >= CURRENT_DATE - INTERVAL '60 days' AND completed_at < CURRENT_DATE - INTERVAL '30 days'
        ) base
      ), 0),
      0
    )
  ON CONFLICT (metric_date) DO UPDATE SET
    churn_rate = EXCLUDED.churn_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule weekly retention on Sundays
SELECT cron.schedule(
  'calculate-retention',
  '0 1 * * 0',  -- Every Sunday at 1 AM
  'SELECT calculate_retention_metrics()'
);
