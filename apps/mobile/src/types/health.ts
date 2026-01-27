// Health Integration Types

export type WorkoutType =
  | 'shadowboxing'
  | 'bag_work'
  | 'pad_work'
  | 'sparring'
  | 'drill'
  | 'cardio'
  | 'conditioning';

export interface BoxingWorkout {
  id: string;
  type: WorkoutType;
  startDate: string; // ISO date
  endDate: string; // ISO date
  duration: number; // seconds
  calories?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
}

// Calories per minute estimates by workout type
export const CALORIE_RATES: Record<WorkoutType, number> = {
  shadowboxing: 8,
  bag_work: 10,
  pad_work: 9,
  sparring: 12,
  drill: 6,
  cardio: 10,
  conditioning: 8,
};

export interface HealthPermissions {
  canWriteWorkouts: boolean;
  canReadWorkouts: boolean;
  canWriteCalories: boolean;
  canReadHeartRate: boolean;
}

export interface HealthSettings {
  syncEnabled: boolean;
  permissionsGranted: boolean;
  lastSyncDate?: string;
}

export const DEFAULT_HEALTH_SETTINGS: HealthSettings = {
  syncEnabled: false,
  permissionsGranted: false,
};
