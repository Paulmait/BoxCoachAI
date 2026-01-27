// Gamification Types

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Ionicons name
  category: AchievementCategory;
  requirement: AchievementRequirement;
  xpReward: number;
  unlockedAt?: string; // ISO date
}

export type AchievementCategory =
  | 'analysis'
  | 'drills'
  | 'streaks'
  | 'scores'
  | 'milestones';

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'score' | 'level';
  target: number;
  metric: string;
}

export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
}

export interface UserGamificationState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakProtectionUsed: boolean;
  achievements: string[]; // achievement IDs
  totalAnalyses: number;
  totalDrills: number;
  highestScore: number;
}

export const XP_REWARDS = {
  ANALYSIS_COMPLETE: 50,
  DRILL_COMPLETE: 20,
  DAILY_STREAK: 30,
  ACHIEVEMENT_UNLOCK: 100,
  FIRST_ANALYSIS: 100,
  PERFECT_SCORE: 200,
} as const;

export const LEVELS: Level[] = [
  { level: 1, name: 'Beginner', minXP: 0, maxXP: 100 },
  { level: 2, name: 'Novice', minXP: 100, maxXP: 300 },
  { level: 3, name: 'Amateur', minXP: 300, maxXP: 600 },
  { level: 4, name: 'Intermediate', minXP: 600, maxXP: 1000 },
  { level: 5, name: 'Advanced', minXP: 1000, maxXP: 1500 },
  { level: 6, name: 'Expert', minXP: 1500, maxXP: 2200 },
  { level: 7, name: 'Elite', minXP: 2200, maxXP: 3000 },
  { level: 8, name: 'Master', minXP: 3000, maxXP: 4000 },
  { level: 9, name: 'Champion', minXP: 4000, maxXP: 5500 },
  { level: 10, name: 'Legend', minXP: 5500, maxXP: Infinity },
];

export interface XPGain {
  amount: number;
  reason: string;
  timestamp: string;
}

export interface AchievementUnlock {
  achievement: Achievement;
  unlockedAt: string;
}
