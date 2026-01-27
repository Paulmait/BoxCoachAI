import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvyzvqzpmlqvnkujjaao.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eXp2cXpwbWxxdm5rdWpqYWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzMyNzQsImV4cCI6MjA4NTA0OTI3NH0.4kOcVWaq8jTE4HgpPua1WkqfYqIDahLZFnZ8832uI4M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'user' | 'admin' | 'super_admin';
  is_suspended: boolean;
  suspension_reason: string | null;
  experience_level: string;
  created_at: string;
}

export interface AppMetrics {
  metric_date: string;
  total_users: number;
  active_users_daily: number;
  new_signups: number;
  total_analyses: number;
  total_drills_completed: number;
  premium_users: number;
}

export interface Violation {
  id: string;
  user_id: string;
  violation_type: string;
  description: string | null;
  status: string;
  created_at: string;
}
