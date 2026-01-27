import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  UserPreferences,
  TechniqueAnalysis,
  PendingAnalysis,
  Stance,
  ExperienceLevel,
} from '@/types';

interface AppState {
  // Initialization
  isInitialized: boolean;

  // User state
  user: User | null;
  isPremium: boolean;
  analysesUsedToday: number;
  lastAnalysisDate: string | null;

  // Analysis state
  currentAnalysis: TechniqueAnalysis | null;
  analysisHistory: TechniqueAnalysis[];
  pendingAnalyses: PendingAnalysis[];

  // User preferences
  preferences: UserPreferences;

  // Onboarding
  hasCompletedOnboarding: boolean;
  hasGivenAIConsent: boolean;

  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsPremium: (isPremium: boolean) => void;
  incrementAnalysesUsed: () => void;
  resetDailyAnalyses: () => void;

  setCurrentAnalysis: (analysis: TechniqueAnalysis | null) => void;
  addAnalysisToHistory: (analysis: TechniqueAnalysis) => void;
  removeAnalysisFromHistory: (analysisId: string) => void;

  addPendingAnalysis: (analysis: PendingAnalysis) => void;
  updatePendingAnalysis: (id: string, updates: Partial<PendingAnalysis>) => void;
  removePendingAnalysis: (id: string) => void;

  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setUserStance: (stance: Stance) => void;
  setUserExperienceLevel: (level: ExperienceLevel) => void;

  setHasCompletedOnboarding: (completed: boolean) => void;
  setHasGivenAIConsent: (consent: boolean) => void;

  signOut: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  biometricsEnabled: false,
  notificationsEnabled: true,
  preferredDrillDuration: 15,
  aiConsentGiven: false,
  // New preferences for enhanced features
  audioCoachingEnabled: true,
  audioCoachingRate: 1.0,
  audioCoachingVolume: 1.0,
  hapticEnabled: true,
  timerSoundEnabled: true,
  timerVibrationEnabled: true,
  healthSyncEnabled: false,
  healthPermissionsGranted: false,
};

const FREE_DAILY_LIMIT = 3;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      user: null,
      isPremium: false,
      analysesUsedToday: 0,
      lastAnalysisDate: null,
      currentAnalysis: null,
      analysisHistory: [],
      pendingAnalyses: [],
      preferences: DEFAULT_PREFERENCES,
      hasCompletedOnboarding: false,
      hasGivenAIConsent: false,

      // Actions
      initialize: async () => {
        const state = get();
        // Reset daily counter if it's a new day
        const today = new Date().toISOString().split('T')[0];
        if (state.lastAnalysisDate !== today) {
          set({ analysesUsedToday: 0, lastAnalysisDate: today });
        }
        set({ isInitialized: true });
      },

      setUser: (user) => set({ user }),

      setIsPremium: (isPremium) => set({ isPremium }),

      incrementAnalysesUsed: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          analysesUsedToday: state.analysesUsedToday + 1,
          lastAnalysisDate: today,
        }));
      },

      resetDailyAnalyses: () => {
        const today = new Date().toISOString().split('T')[0];
        set({ analysesUsedToday: 0, lastAnalysisDate: today });
      },

      setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

      addAnalysisToHistory: (analysis) =>
        set((state) => ({
          analysisHistory: [analysis, ...state.analysisHistory].slice(0, 50), // Keep last 50
        })),

      removeAnalysisFromHistory: (analysisId) =>
        set((state) => ({
          analysisHistory: state.analysisHistory.filter((a) => a.id !== analysisId),
        })),

      addPendingAnalysis: (analysis) =>
        set((state) => ({
          pendingAnalyses: [...state.pendingAnalyses, analysis],
        })),

      updatePendingAnalysis: (id, updates) =>
        set((state) => ({
          pendingAnalyses: state.pendingAnalyses.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removePendingAnalysis: (id) =>
        set((state) => ({
          pendingAnalyses: state.pendingAnalyses.filter((a) => a.id !== id),
        })),

      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),

      setUserStance: (stance) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                profile: { ...state.user.profile, stance },
              }
            : null,
        })),

      setUserExperienceLevel: (experienceLevel) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                profile: { ...state.user.profile, experienceLevel },
              }
            : null,
        })),

      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),

      setHasGivenAIConsent: (consent) =>
        set((state) => ({
          hasGivenAIConsent: consent,
          preferences: {
            ...state.preferences,
            aiConsentGiven: consent,
            aiConsentDate: consent ? new Date().toISOString() : undefined,
          },
        })),

      signOut: () =>
        set({
          user: null,
          isPremium: false,
          currentAnalysis: null,
          // Keep history and preferences for re-login
        }),
    }),
    {
      name: 'boxcoach-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        isPremium: state.isPremium,
        analysesUsedToday: state.analysesUsedToday,
        lastAnalysisDate: state.lastAnalysisDate,
        analysisHistory: state.analysisHistory,
        pendingAnalyses: state.pendingAnalyses,
        preferences: state.preferences,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasGivenAIConsent: state.hasGivenAIConsent,
      }),
    }
  )
);

// Selectors
export const selectCanAnalyze = (state: AppState): boolean => {
  if (state.isPremium) return true;
  return state.analysesUsedToday < FREE_DAILY_LIMIT;
};

export const selectRemainingAnalyses = (state: AppState): number => {
  if (state.isPremium) return Infinity;
  return Math.max(0, FREE_DAILY_LIMIT - state.analysesUsedToday);
};

export const selectNeedsAIConsent = (state: AppState): boolean => {
  return !state.hasGivenAIConsent;
};

export const FREE_ANALYSIS_LIMIT = FREE_DAILY_LIMIT;
