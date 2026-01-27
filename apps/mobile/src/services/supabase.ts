import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          stance: 'orthodox' | 'southpaw';
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
          goals: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          stance?: 'orthodox' | 'southpaw';
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
          goals?: string[];
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          video_url: string;
          thumbnail_url: string | null;
          overall_score: number;
          stance: 'orthodox' | 'southpaw';
          technique_scores: object;
          root_causes: object;
          summary: string;
          top_strengths: string[];
          priority_improvements: string[];
          recommended_drills: string[];
          boxer_selection: object | null;
          created_at: string;
          analyzed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['analyses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['analyses']['Insert']>;
      };
      drill_completions: {
        Row: {
          id: string;
          user_id: string;
          drill_id: string;
          completed_at: string;
          duration: number;
          rating: number | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['drill_completions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['drill_completions']['Insert']>;
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string;
          event: string;
          properties: object | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['analytics_events']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['analytics_events']['Insert']>;
      };
    };
  };
};
