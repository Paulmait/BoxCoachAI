import { createClient } from '@supabase/supabase-js';

// Load from environment variables (Vite uses import.meta.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Create apps/admin/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

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
