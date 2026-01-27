-- Migration: Suspended User RLS Policies
-- Prevents suspended users from accessing their data

-- Create a function to check if user is not suspended
CREATE OR REPLACE FUNCTION is_user_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  suspended BOOLEAN;
  suspended_at TIMESTAMPTZ;
  suspension_reason TEXT;
BEGIN
  SELECT is_suspended, profiles.suspended_at, profiles.suspension_reason
  INTO suspended, suspended_at, suspension_reason
  FROM profiles
  WHERE id = user_id;

  -- User not found or not suspended
  IF suspended IS NULL OR suspended = false THEN
    RETURN true;
  END IF;

  -- Check for temporary pause expiration
  IF suspension_reason LIKE '%hours%' AND suspended_at IS NOT NULL THEN
    -- Extract hours from reason
    DECLARE
      hours_match TEXT;
      pause_hours INTEGER;
      pause_end TIMESTAMPTZ;
    BEGIN
      hours_match := substring(suspension_reason FROM '(\d+)\s*hours');
      IF hours_match IS NOT NULL THEN
        pause_hours := hours_match::INTEGER;
        pause_end := suspended_at + (pause_hours || ' hours')::INTERVAL;

        -- If pause has expired, auto-unsuspend
        IF NOW() >= pause_end THEN
          UPDATE profiles
          SET is_suspended = false,
              suspension_reason = NULL,
              suspended_at = NULL
          WHERE id = user_id;
          RETURN true;
        END IF;
      END IF;
    END;
  END IF;

  -- User is suspended
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update analyses RLS to check suspension
DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (
    user_id = auth.uid()
    AND is_user_active(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own analyses" ON analyses;
CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_user_active(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own analyses" ON analyses;
CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  USING (
    user_id = auth.uid()
    AND is_user_active(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own analyses" ON analyses;
CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING (
    user_id = auth.uid()
    AND is_user_active(auth.uid())
  );

-- Update drill_completions RLS to check suspension
DROP POLICY IF EXISTS "Users can view own drill completions" ON drill_completions;
CREATE POLICY "Users can view own drill completions"
  ON drill_completions FOR SELECT
  USING (
    user_id = auth.uid()
    AND is_user_active(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own drill completions" ON drill_completions;
CREATE POLICY "Users can insert own drill completions"
  ON drill_completions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_user_active(auth.uid())
  );

-- Update videos RLS to check suspension (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'videos') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own videos" ON videos';
    EXECUTE 'CREATE POLICY "Users can view own videos"
      ON videos FOR SELECT
      USING (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can upload own videos" ON videos';
    EXECUTE 'CREATE POLICY "Users can upload own videos"
      ON videos FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own videos" ON videos';
    EXECUTE 'CREATE POLICY "Users can delete own videos"
      ON videos FOR DELETE
      USING (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';
  END IF;
END $$;

-- Update user_achievements RLS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements';
    EXECUTE 'CREATE POLICY "Users can view own achievements"
      ON user_achievements FOR SELECT
      USING (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements';
    EXECUTE 'CREATE POLICY "Users can insert own achievements"
      ON user_achievements FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';
  END IF;
END $$;

-- Update training_plan_progress RLS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_plan_progress') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own plan progress" ON training_plan_progress';
    EXECUTE 'CREATE POLICY "Users can view own plan progress"
      ON training_plan_progress FOR SELECT
      USING (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';
  END IF;
END $$;

-- Update journal_entries RLS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own journal entries" ON journal_entries';
    EXECUTE 'CREATE POLICY "Users can view own journal entries"
      ON journal_entries FOR SELECT
      USING (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries';
    EXECUTE 'CREATE POLICY "Users can insert own journal entries"
      ON journal_entries FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries';
    EXECUTE 'CREATE POLICY "Users can update own journal entries"
      ON journal_entries FOR UPDATE
      USING (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';
  END IF;
END $$;

-- Update weight_entries RLS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_entries') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own weight entries" ON weight_entries';
    EXECUTE 'CREATE POLICY "Users can view own weight entries"
      ON weight_entries FOR SELECT
      USING (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own weight entries" ON weight_entries';
    EXECUTE 'CREATE POLICY "Users can insert own weight entries"
      ON weight_entries FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND is_user_active(auth.uid())
      )';
  END IF;
END $$;

-- Allow suspended users to view their own profile (to see suspension info)
-- but not update it
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    AND is_user_active(auth.uid())
  );

-- Storage policies for suspended users
-- Block suspended users from uploading new files
DO $$
BEGIN
  -- Update storage policy for videos bucket
  DELETE FROM storage.policies WHERE name = 'Users can upload videos' AND bucket_id = 'videos';
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  VALUES (
    'Users can upload videos',
    'videos',
    'INSERT',
    '(auth.uid() IS NOT NULL AND is_user_active(auth.uid()))'
  ) ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Storage policies table doesn't exist (older Supabase version)
END $$;

-- Add index for faster suspension checks
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(id) WHERE is_suspended = true;

COMMENT ON FUNCTION is_user_active IS 'Checks if a user is active (not suspended). Auto-unsuspends users whose temporary pause has expired.';
