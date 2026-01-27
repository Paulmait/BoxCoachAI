export type PunchType = 'jab' | 'cross' | 'hook' | 'uppercut' | 'body_shot' | 'combination';

export type Stance = 'orthodox' | 'southpaw';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type TechniqueCategory =
  | 'stance'
  | 'guard'
  | 'footwork'
  | 'jab'
  | 'cross'
  | 'hook'
  | 'uppercut'
  | 'defense'
  | 'head_movement'
  | 'combinations';

export type RootCause =
  | 'stance_width'
  | 'weight_distribution'
  | 'guard_position'
  | 'elbow_flare'
  | 'hip_rotation'
  | 'shoulder_turn'
  | 'footwork_timing'
  | 'balance_issues'
  | 'telegraphing'
  | 'recovery_position'
  | 'breathing'
  | 'chin_exposure';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface DetectedPerson {
  id: string;
  boundingBox: BoundingBox;
  confidence: number;
  label?: string; // e.g., "left", "right", "center"
}

export interface BoxerSelection {
  personId: string;
  boundingBox: BoundingBox;
  frameIndex: number;
  timestamp: number;
}

export interface TechniqueScore {
  category: TechniqueCategory;
  score: number; // 1-100
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface RootCauseAnalysis {
  cause: RootCause;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  recommendedDrills: string[]; // drill IDs
}

export interface TechniqueAnalysis {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  overallScore: number; // 1-100
  stance: Stance;
  techniqueScores: TechniqueScore[];
  rootCauses: RootCauseAnalysis[];
  summary: string;
  topStrengths: string[];
  priorityImprovements: string[];
  recommendedDrills: string[];
  boxerSelection?: BoxerSelection;
  createdAt: string;
  analyzedAt: string;
}

export interface PendingAnalysis {
  id: string;
  localVideoUri: string;
  boxerSelection?: BoxerSelection;
  createdAt: string;
  status: 'queued' | 'uploading' | 'processing' | 'failed';
  errorMessage?: string;
  retryCount: number;
}

export interface AnalysisRequest {
  videoUri: string;
  boxerSelection?: BoxerSelection;
  userStance: Stance;
  experienceLevel: ExperienceLevel;
}

export interface AnalysisResponse {
  success: boolean;
  analysis?: TechniqueAnalysis;
  error?: string;
}

export interface DetectionRequest {
  frameBase64: string;
}

export interface DetectionResponse {
  success: boolean;
  people: DetectedPerson[];
  error?: string;
}
