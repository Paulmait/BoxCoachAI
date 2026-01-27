// Gamification Store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  UserGamificationState,
  Achievement,
  XPGain,
  Level,
} from '@/types/gamification';
import { LEVELS, XP_REWARDS } from '@/types/gamification';
import { ACHIEVEMENTS } from '@/data/achievements';

interface GamificationStore extends UserGamificationState {
  // Pending notifications
  pendingXPGains: XPGain[];
  pendingAchievements: Achievement[];

  // Actions
  addXP: (amount: number, reason: string) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  useStreakProtection: () => boolean;
  incrementTotalAnalyses: () => void;
  incrementTotalDrills: () => void;
  updateHighestScore: (score: number) => void;
  clearPendingNotifications: () => void;
  checkAchievements: () => Achievement[];
  resetGamification: () => void;
}

const initialState: UserGamificationState = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  streakProtectionUsed: false,
  achievements: [],
  totalAnalyses: 0,
  totalDrills: 0,
  highestScore: 0,
};

function calculateLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

function getLevelInfo(level: number): Level {
  return LEVELS.find((l) => l.level === level) || LEVELS[0];
}

export const useGamificationStore = create<GamificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      pendingXPGains: [],
      pendingAchievements: [],

      addXP: (amount, reason) => {
        set((state) => {
          const newXP = state.xp + amount;
          const newLevel = calculateLevel(newXP);

          const xpGain: XPGain = {
            amount,
            reason,
            timestamp: new Date().toISOString(),
          };

          return {
            xp: newXP,
            level: newLevel,
            pendingXPGains: [...state.pendingXPGains, xpGain],
          };
        });
      },

      unlockAchievement: (achievementId) => {
        set((state) => {
          if (state.achievements.includes(achievementId)) {
            return state;
          }

          const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
          if (!achievement) return state;

          const newXP = state.xp + achievement.xpReward;
          const newLevel = calculateLevel(newXP);

          return {
            achievements: [...state.achievements, achievementId],
            xp: newXP,
            level: newLevel,
            pendingAchievements: [...state.pendingAchievements, {
              ...achievement,
              unlockedAt: new Date().toISOString(),
            }],
          };
        });
      },

      updateStreak: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const lastActivity = state.lastActivityDate;

          if (lastActivity === today) {
            // Already active today
            return state;
          }

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = state.currentStreak;
          let streakProtectionUsed = state.streakProtectionUsed;

          if (lastActivity === yesterdayStr) {
            // Consecutive day
            newStreak += 1;
          } else if (lastActivity) {
            // Check if we can use streak protection
            const dayBeforeYesterday = new Date();
            dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
            const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];

            if (lastActivity === dayBeforeYesterdayStr && !state.streakProtectionUsed) {
              // Use streak protection (missed one day)
              streakProtectionUsed = true;
              newStreak += 1;
            } else {
              // Streak broken
              newStreak = 1;
              streakProtectionUsed = false;
            }
          } else {
            // First activity
            newStreak = 1;
          }

          const newLongestStreak = Math.max(state.longestStreak, newStreak);

          return {
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastActivityDate: today,
            streakProtectionUsed,
          };
        });

        // Award streak XP
        get().addXP(XP_REWARDS.DAILY_STREAK, 'Daily streak');
      },

      useStreakProtection: () => {
        const state = get();
        if (state.streakProtectionUsed) {
          return false;
        }
        set({ streakProtectionUsed: true });
        return true;
      },

      incrementTotalAnalyses: () => {
        set((state) => ({
          totalAnalyses: state.totalAnalyses + 1,
        }));
        get().addXP(XP_REWARDS.ANALYSIS_COMPLETE, 'Analysis complete');
        get().updateStreak();
        get().checkAchievements();
      },

      incrementTotalDrills: () => {
        set((state) => ({
          totalDrills: state.totalDrills + 1,
        }));
        get().addXP(XP_REWARDS.DRILL_COMPLETE, 'Drill complete');
        get().updateStreak();
        get().checkAchievements();
      },

      updateHighestScore: (score) => {
        set((state) => ({
          highestScore: Math.max(state.highestScore, score),
        }));
        if (score >= 90) {
          get().addXP(XP_REWARDS.PERFECT_SCORE, 'Excellent score!');
        }
        get().checkAchievements();
      },

      clearPendingNotifications: () => {
        set({
          pendingXPGains: [],
          pendingAchievements: [],
        });
      },

      checkAchievements: () => {
        const state = get();
        const newAchievements: Achievement[] = [];

        for (const achievement of ACHIEVEMENTS) {
          if (state.achievements.includes(achievement.id)) {
            continue;
          }

          let unlocked = false;
          const { type, target, metric } = achievement.requirement;

          switch (type) {
            case 'count':
              if (metric === 'analyses' && state.totalAnalyses >= target) {
                unlocked = true;
              } else if (metric === 'drills' && state.totalDrills >= target) {
                unlocked = true;
              }
              break;
            case 'streak':
              if (metric === 'current' && state.currentStreak >= target) {
                unlocked = true;
              } else if (metric === 'longest' && state.longestStreak >= target) {
                unlocked = true;
              }
              break;
            case 'score':
              if (state.highestScore >= target) {
                unlocked = true;
              }
              break;
            case 'level':
              if (state.level >= target) {
                unlocked = true;
              }
              break;
          }

          if (unlocked) {
            get().unlockAchievement(achievement.id);
            newAchievements.push(achievement);
          }
        }

        return newAchievements;
      },

      resetGamification: () => {
        set({
          ...initialState,
          pendingXPGains: [],
          pendingAchievements: [],
        });
      },
    }),
    {
      name: 'boxcoach-gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActivityDate: state.lastActivityDate,
        streakProtectionUsed: state.streakProtectionUsed,
        achievements: state.achievements,
        totalAnalyses: state.totalAnalyses,
        totalDrills: state.totalDrills,
        highestScore: state.highestScore,
      }),
    }
  )
);

// Selectors
export const selectXP = (state: GamificationStore) => state.xp;
export const selectLevel = (state: GamificationStore) => state.level;
export const selectLevelInfo = (state: GamificationStore) => getLevelInfo(state.level);
export const selectXPProgress = (state: GamificationStore) => {
  const levelInfo = getLevelInfo(state.level);
  const nextLevel = getLevelInfo(state.level + 1);
  const xpInLevel = state.xp - levelInfo.minXP;
  const xpForLevel = nextLevel.minXP - levelInfo.minXP;
  return {
    current: xpInLevel,
    required: xpForLevel,
    percentage: Math.min(100, (xpInLevel / xpForLevel) * 100),
  };
};
export const selectCurrentStreak = (state: GamificationStore) => state.currentStreak;
export const selectAchievements = (state: GamificationStore) =>
  ACHIEVEMENTS.filter((a) => state.achievements.includes(a.id));
export const selectPendingAchievements = (state: GamificationStore) =>
  state.pendingAchievements;
export const selectPendingXPGains = (state: GamificationStore) => state.pendingXPGains;
