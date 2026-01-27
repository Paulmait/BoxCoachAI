-- BoxCoach AI Database Schema
-- Run this migration to set up the initial database structure

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  stance TEXT NOT NULL DEFAULT 'orthodox' CHECK (stance IN ('orthodox', 'southpaw')),
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  goals TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analyses table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  stance TEXT NOT NULL CHECK (stance IN ('orthodox', 'southpaw')),
  technique_scores JSONB NOT NULL DEFAULT '[]',
  root_causes JSONB NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL,
  top_strengths TEXT[] DEFAULT '{}',
  priority_improvements TEXT[] DEFAULT '{}',
  recommended_drills TEXT[] DEFAULT '{}',
  boxer_selection JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drill completions table
CREATE TABLE drill_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  drill_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL, -- in minutes
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  properties JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences table (for storing AI consent, etc.)
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  biometrics_enabled BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  ai_consent_given BOOLEAN DEFAULT FALSE,
  ai_consent_date TIMESTAMPTZ,
  privacy_policy_accepted_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  preferred_drill_duration INTEGER DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE rate_limits (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  analyses_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Indexes for performance
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_drill_completions_user_id ON drill_completions(user_id);
CREATE INDEX idx_drill_completions_drill_id ON drill_completions(drill_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_rate_limits_user_date ON rate_limits(user_id, date);

-- Row Level Security Policies

-- Profiles: users can only access their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Analyses: users can only access their own analyses
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Drill completions: users can only access their own completions
ALTER TABLE drill_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drill completions"
  ON drill_completions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own drill completions"
  ON drill_completions FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Analytics events: users can only insert their own events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- User preferences: users can only access their own preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Rate limits: users can only access their own limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Functions

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID, p_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Get or create today's count
  INSERT INTO rate_limits (user_id, date, analyses_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  SELECT analyses_count INTO v_count
  FROM rate_limits
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment count
  UPDATE rate_limits
  SET analyses_count = analyses_count + 1
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
