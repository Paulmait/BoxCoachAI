// Training Journal Types

export type JournalEntryType =
  | 'sparring'
  | 'bag_work'
  | 'pad_work'
  | 'gym_session'
  | 'cardio'
  | 'strength'
  | 'drill'
  | 'analysis'
  | 'custom';

export type Mood = 'great' | 'good' | 'okay' | 'tired' | 'struggling';
export type Intensity = 'light' | 'moderate' | 'hard' | 'intense';

export interface JournalEntry {
  id: string;
  date: string; // ISO date
  type: JournalEntryType;
  title: string;
  notes?: string;
  duration?: number; // minutes
  mood?: Mood;
  intensity?: Intensity;
  techniques?: string[];
  linkedDrillId?: string;
  linkedAnalysisId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalStats {
  totalEntries: number;
  totalDuration: number; // minutes
  entriesByType: Record<JournalEntryType, number>;
  averageMood: number;
  averageIntensity: number;
  mostActiveDay: string; // day of week
}

export interface CalendarDay {
  date: string;
  hasEntry: boolean;
  entries: JournalEntry[];
}
