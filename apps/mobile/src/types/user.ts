import type { Stance, ExperienceLevel, TechniqueCategory } from './analysis';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  stance: Stance;
  experienceLevel: ExperienceLevel;
  goals: UserGoal[];
  createdAt: string;
  updatedAt: string;
}

export type UserGoal =
  | 'improve_technique'
  | 'competition_prep'
  | 'fitness'
  | 'self_defense'
  | 'fun';

export interface UserPreferences {
  biometricsEnabled: boolean;
  notificationsEnabled: boolean;
  reminderTime?: string; // HH:mm format
  preferredDrillDuration: number; // minutes
  aiConsentGiven: boolean;
  aiConsentDate?: string;
  privacyPolicyAcceptedAt?: string;
  termsAcceptedAt?: string;
}

export interface UserSubscription {
  isPremium: boolean;
  plan?: 'monthly' | 'annual';
  expiresAt?: string;
  willRenew: boolean;
  customerId?: string;
}

export interface UserStats {
  totalAnalyses: number;
  analysesThisMonth: number;
  totalDrillMinutes: number;
  drillsCompleted: number;
  currentStreak: number; // days
  longestStreak: number;
  averageScore: number;
  scoreHistory: ScoreHistoryEntry[];
  techniqueProgress: TechniqueProgress[];
}

export interface ScoreHistoryEntry {
  date: string;
  score: number;
  analysisId: string;
}

export interface TechniqueProgress {
  technique: TechniqueCategory;
  scores: {
    date: string;
    score: number;
  }[];
  currentScore: number;
  improvement: number; // percentage change from first to last
}

export interface UserProgress {
  profile: UserProfile;
  preferences: UserPreferences;
  subscription: UserSubscription;
  stats: UserStats;
}

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  preferences: UserPreferences;
  subscription: UserSubscription;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  event: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

export type AnalyticsEventType =
  | 'app_open'
  | 'sign_up'
  | 'sign_in'
  | 'sign_out'
  | 'analysis_started'
  | 'analysis_completed'
  | 'boxer_selected'
  | 'drill_started'
  | 'drill_completed'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'paywall_viewed'
  | 'ai_consent_given'
  | 'ai_consent_declined';
