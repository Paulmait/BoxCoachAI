import { supabase } from './supabase';
import { useAppStore } from '@/store/useAppStore';
import type { User, UserProfile, UserPreferences, UserSubscription } from '@/types';

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

class AuthService {
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile
        await this.createProfile(data.user.id, email);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const user = await this.loadUserData(data.user.id, email);
        useAppStore.getState().setUser(user);
        return { success: true, user };
      }

      return { success: false, error: 'Failed to sign in' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    useAppStore.getState().signOut();
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'boxcoach://reset-password',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh failed:', error);
      return null;
    }
    return data.session;
  }

  async restoreSessionWithToken(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: '', // Will be refreshed
        refresh_token: refreshToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        const user = await this.loadUserData(data.user.id, data.user.email || '');
        useAppStore.getState().setUser(user);
        return { success: true, user };
      }

      return { success: false, error: 'Session restoration failed' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getCurrentRefreshToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.refresh_token || null;
    } catch {
      return null;
    }
  }

  private async createProfile(userId: string, email: string): Promise<void> {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      email,
      stance: 'orthodox',
      experience_level: 'beginner',
      goals: [],
    });

    if (error) {
      console.error('Failed to create profile:', error);
    }
  }

  private async loadUserData(userId: string, email: string): Promise<User> {
    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const profile: UserProfile = profileData
      ? {
          id: profileData.id,
          email: profileData.email,
          displayName: profileData.display_name ?? undefined,
          avatarUrl: profileData.avatar_url ?? undefined,
          stance: profileData.stance,
          experienceLevel: profileData.experience_level,
          goals: profileData.goals || [],
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        }
      : {
          id: userId,
          email,
          stance: 'orthodox',
          experienceLevel: 'beginner',
          goals: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

    const preferences: UserPreferences = {
      biometricsEnabled: false,
      notificationsEnabled: true,
      preferredDrillDuration: 15,
      aiConsentGiven: false,
    };

    const subscription: UserSubscription = {
      isPremium: false,
      willRenew: false,
    };

    return {
      id: userId,
      email,
      profile,
      preferences,
      subscription,
    };
  }

  setupAuthListener() {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await this.loadUserData(session.user.id, session.user.email || '');
        useAppStore.getState().setUser(user);
      } else if (event === 'SIGNED_OUT') {
        useAppStore.getState().signOut();
      }
    });
  }
}

export const authService = new AuthService();
