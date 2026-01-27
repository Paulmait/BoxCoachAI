// Combo Randomizer Types

export type PunchNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface Punch {
  number: PunchNumber;
  name: string;
  shortName: string;
  isBodyShot?: boolean;
}

export const PUNCHES: Punch[] = [
  { number: 1, name: 'Jab', shortName: 'Jab' },
  { number: 2, name: 'Cross', shortName: 'Cross' },
  { number: 3, name: 'Lead Hook', shortName: 'Hook' },
  { number: 4, name: 'Rear Hook', shortName: 'Hook' },
  { number: 5, name: 'Lead Uppercut', shortName: 'Upper' },
  { number: 6, name: 'Rear Uppercut', shortName: 'Upper' },
];

export interface ComboConfig {
  minPunches: number;
  maxPunches: number;
  includeBodyShots: boolean;
  includePowerPunches: boolean;
  interval: number; // seconds between combos
  audioEnabled: boolean;
}

export const DEFAULT_COMBO_CONFIG: ComboConfig = {
  minPunches: 2,
  maxPunches: 4,
  includeBodyShots: false,
  includePowerPunches: true,
  interval: 5,
  audioEnabled: true,
};

export interface Combo {
  punches: Punch[];
  displayNumbers: string; // e.g., "1-2-3"
  displayNames: string; // e.g., "Jab-Cross-Hook"
}

export type DifficultyPreset = 'beginner' | 'intermediate' | 'advanced';

export const COMBO_PRESETS: Record<DifficultyPreset, ComboConfig> = {
  beginner: {
    minPunches: 2,
    maxPunches: 3,
    includeBodyShots: false,
    includePowerPunches: false,
    interval: 8,
    audioEnabled: true,
  },
  intermediate: {
    minPunches: 3,
    maxPunches: 4,
    includeBodyShots: false,
    includePowerPunches: true,
    interval: 5,
    audioEnabled: true,
  },
  advanced: {
    minPunches: 4,
    maxPunches: 6,
    includeBodyShots: true,
    includePowerPunches: true,
    interval: 3,
    audioEnabled: true,
  },
};
