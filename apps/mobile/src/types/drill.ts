import type { RootCause, TechniqueCategory, ExperienceLevel } from './analysis';

export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type DrillCategory =
  | 'fundamentals'
  | 'offense'
  | 'defense'
  | 'footwork'
  | 'conditioning'
  | 'combinations';

export type DrillEquipment =
  | 'none'
  | 'heavy_bag'
  | 'speed_bag'
  | 'double_end_bag'
  | 'mitts'
  | 'jump_rope'
  | 'ladder'
  | 'mirror'
  | 'slip_bag';

export interface DrillStep {
  order: number;
  instruction: string;
  duration?: number; // seconds
  reps?: number;
  tips?: string[];
}

export interface BoxingDrill {
  id: string;
  name: string;
  description: string;
  category: DrillCategory;
  difficulty: DrillDifficulty;
  targetTechniques: TechniqueCategory[];
  addressesRootCauses: RootCause[];
  duration: number; // estimated minutes
  equipment: DrillEquipment[];
  steps: DrillStep[];
  videoUrl?: string;
  thumbnailUrl?: string;
  tips: string[];
  commonMistakes: string[];
  progressionDrills?: string[]; // drill IDs for harder versions
  regressionDrills?: string[]; // drill IDs for easier versions
}

export interface DrillCompletion {
  id: string;
  drillId: string;
  userId: string;
  completedAt: string;
  duration: number; // actual minutes spent
  rating?: number; // user self-rating 1-5
  notes?: string;
}

export interface DrillProgress {
  drillId: string;
  completionCount: number;
  lastCompletedAt?: string;
  averageRating?: number;
  totalMinutes: number;
}

export interface DrillRecommendation {
  drill: BoxingDrill;
  relevanceScore: number; // 0-1
  reason: string;
  matchedRootCauses: RootCause[];
}

export interface DrillFilter {
  categories?: DrillCategory[];
  difficulties?: DrillDifficulty[];
  equipment?: DrillEquipment[];
  targetTechniques?: TechniqueCategory[];
  maxDuration?: number;
  experienceLevel?: ExperienceLevel;
}

export interface DrillSession {
  id: string;
  userId: string;
  drills: DrillCompletion[];
  startedAt: string;
  completedAt?: string;
  totalDuration: number;
  notes?: string;
}
