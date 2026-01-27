// Calorie Estimation Utility
import { CALORIE_RATES, WorkoutType } from '@/types/health';

/**
 * Estimate calories burned for a boxing workout
 * @param type - Type of workout
 * @param durationMinutes - Duration in minutes
 * @param weight - User weight in kg (optional, defaults to 70kg)
 * @returns Estimated calories burned
 */
export function estimateCalories(
  type: WorkoutType,
  durationMinutes: number,
  weight: number = 70
): number {
  const baseRate = CALORIE_RATES[type] || 8;
  // Adjust for weight (baseline is 70kg)
  const weightMultiplier = weight / 70;
  const calories = Math.round(baseRate * durationMinutes * weightMultiplier);
  return calories;
}

/**
 * Get a description of workout intensity based on calorie burn rate
 */
export function getIntensityDescription(type: WorkoutType): string {
  const rate = CALORIE_RATES[type];
  if (rate >= 11) return 'High intensity';
  if (rate >= 8) return 'Moderate intensity';
  return 'Light intensity';
}

/**
 * Format calories for display
 */
export function formatCalories(calories: number): string {
  if (calories >= 1000) {
    return `${(calories / 1000).toFixed(1)}k`;
  }
  return `${calories}`;
}

/**
 * Calculate MET (Metabolic Equivalent of Task) for boxing activities
 */
export function getMET(type: WorkoutType): number {
  const metValues: Record<WorkoutType, number> = {
    shadowboxing: 5.5,
    bag_work: 7.8,
    pad_work: 7.0,
    sparring: 9.0,
    drill: 4.5,
    cardio: 8.0,
    conditioning: 6.5,
  };
  return metValues[type] || 6.0;
}
