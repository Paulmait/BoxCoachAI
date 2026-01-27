// Achievement Definitions
import type { Achievement } from '@/types/gamification';

export const ACHIEVEMENTS: Achievement[] = [
  // Analysis Achievements
  {
    id: 'first_analysis',
    name: 'First Steps',
    description: 'Complete your first video analysis',
    icon: 'videocam',
    category: 'analysis',
    requirement: { type: 'count', target: 1, metric: 'analyses' },
    xpReward: 100,
  },
  {
    id: 'analysis_5',
    name: 'Getting Serious',
    description: 'Complete 5 video analyses',
    icon: 'analytics',
    category: 'analysis',
    requirement: { type: 'count', target: 5, metric: 'analyses' },
    xpReward: 150,
  },
  {
    id: 'analysis_25',
    name: 'Form Student',
    description: 'Complete 25 video analyses',
    icon: 'school',
    category: 'analysis',
    requirement: { type: 'count', target: 25, metric: 'analyses' },
    xpReward: 300,
  },
  {
    id: 'analysis_100',
    name: 'Technique Master',
    description: 'Complete 100 video analyses',
    icon: 'trophy',
    category: 'analysis',
    requirement: { type: 'count', target: 100, metric: 'analyses' },
    xpReward: 500,
  },

  // Drill Achievements
  {
    id: 'first_drill',
    name: 'Drill Sergeant',
    description: 'Complete your first drill',
    icon: 'fitness',
    category: 'drills',
    requirement: { type: 'count', target: 1, metric: 'drills' },
    xpReward: 50,
  },
  {
    id: 'drills_10',
    name: 'Practice Makes Perfect',
    description: 'Complete 10 drills',
    icon: 'barbell',
    category: 'drills',
    requirement: { type: 'count', target: 10, metric: 'drills' },
    xpReward: 150,
  },
  {
    id: 'drills_50',
    name: 'Dedicated Trainer',
    description: 'Complete 50 drills',
    icon: 'medal',
    category: 'drills',
    requirement: { type: 'count', target: 50, metric: 'drills' },
    xpReward: 300,
  },
  {
    id: 'drills_200',
    name: 'Training Legend',
    description: 'Complete 200 drills',
    icon: 'ribbon',
    category: 'drills',
    requirement: { type: 'count', target: 200, metric: 'drills' },
    xpReward: 500,
  },

  // Streak Achievements
  {
    id: 'streak_3',
    name: 'Consistency',
    description: 'Train for 3 days in a row',
    icon: 'flame',
    category: 'streaks',
    requirement: { type: 'streak', target: 3, metric: 'current' },
    xpReward: 100,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Train for 7 days in a row',
    icon: 'calendar',
    category: 'streaks',
    requirement: { type: 'streak', target: 7, metric: 'current' },
    xpReward: 200,
  },
  {
    id: 'streak_14',
    name: 'Two Week Champion',
    description: 'Train for 14 days in a row',
    icon: 'star',
    category: 'streaks',
    requirement: { type: 'streak', target: 14, metric: 'current' },
    xpReward: 300,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Train for 30 days in a row',
    icon: 'diamond',
    category: 'streaks',
    requirement: { type: 'streak', target: 30, metric: 'current' },
    xpReward: 500,
  },

  // Score Achievements
  {
    id: 'score_70',
    name: 'Good Form',
    description: 'Achieve a score of 70 or higher',
    icon: 'thumbs-up',
    category: 'scores',
    requirement: { type: 'score', target: 70, metric: 'highest' },
    xpReward: 100,
  },
  {
    id: 'score_80',
    name: 'Great Technique',
    description: 'Achieve a score of 80 or higher',
    icon: 'checkmark-circle',
    category: 'scores',
    requirement: { type: 'score', target: 80, metric: 'highest' },
    xpReward: 200,
  },
  {
    id: 'score_90',
    name: 'Near Perfect',
    description: 'Achieve a score of 90 or higher',
    icon: 'sparkles',
    category: 'scores',
    requirement: { type: 'score', target: 90, metric: 'highest' },
    xpReward: 400,
  },
  {
    id: 'score_95',
    name: 'Elite Form',
    description: 'Achieve a score of 95 or higher',
    icon: 'flash',
    category: 'scores',
    requirement: { type: 'score', target: 95, metric: 'highest' },
    xpReward: 600,
  },

  // Level/Milestone Achievements
  {
    id: 'level_3',
    name: 'Rising Fighter',
    description: 'Reach level 3',
    icon: 'arrow-up-circle',
    category: 'milestones',
    requirement: { type: 'level', target: 3, metric: 'level' },
    xpReward: 150,
  },
  {
    id: 'level_5',
    name: 'Skilled Boxer',
    description: 'Reach level 5',
    icon: 'trending-up',
    category: 'milestones',
    requirement: { type: 'level', target: 5, metric: 'level' },
    xpReward: 250,
  },
  {
    id: 'level_7',
    name: 'Expert Fighter',
    description: 'Reach level 7',
    icon: 'podium',
    category: 'milestones',
    requirement: { type: 'level', target: 7, metric: 'level' },
    xpReward: 400,
  },
  {
    id: 'level_10',
    name: 'Boxing Legend',
    description: 'Reach level 10',
    icon: 'shield',
    category: 'milestones',
    requirement: { type: 'level', target: 10, metric: 'level' },
    xpReward: 1000,
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getAchievementsByCategory(category: string): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

export function getLockedAchievements(unlockedIds: string[]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !unlockedIds.includes(a.id));
}

export function getUnlockedAchievements(unlockedIds: string[]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));
}
