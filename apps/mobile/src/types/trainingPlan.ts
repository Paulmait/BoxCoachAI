// Training Plan Types

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPremium: boolean;
  thumbnail?: string;
  tags: string[];
  weeks: TrainingWeek[];
}

export interface TrainingWeek {
  weekNumber: number;
  name: string;
  description?: string;
  days: TrainingDay[];
}

export interface TrainingDay {
  dayNumber: number; // 1-7 for the week
  name: string; // e.g., "Day 1" or "Active Recovery"
  isRestDay: boolean;
  drillIds: string[];
  notes?: string;
  estimatedDuration?: number; // minutes
}

export interface ActivePlan {
  planId: string;
  startDate: string; // ISO date
  currentWeek: number;
  currentDay: number;
  completedDays: CompletedDay[];
}

export interface CompletedDay {
  date: string; // ISO date
  weekNumber: number;
  dayNumber: number;
  drillsCompleted: string[];
  duration?: number; // minutes
}

export interface PlanProgress {
  planId: string;
  totalDays: number;
  completedDays: number;
  percentComplete: number;
  currentStreak: number;
  missedDays: number;
}

export interface TodayTraining {
  planId: string;
  planName: string;
  weekNumber: number;
  dayNumber: number;
  dayName: string;
  isRestDay: boolean;
  drillIds: string[];
  notes?: string;
  isCompleted: boolean;
}
