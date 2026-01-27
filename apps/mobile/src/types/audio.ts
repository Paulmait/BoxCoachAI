// Audio Types

export interface AudioCoachingSettings {
  enabled: boolean;
  volume: number; // 0-1
  rate: number; // 0.5-2
  pitch: number; // 0.5-2
  language: string;
}

export const DEFAULT_AUDIO_COACHING_SETTINGS: AudioCoachingSettings = {
  enabled: true,
  volume: 1.0,
  rate: 1.0,
  pitch: 1.0,
  language: 'en-US',
};

export type SoundType = 'bell_start' | 'bell_end' | 'warning' | 'countdown' | 'success' | 'error';

export interface DrillStepAudio {
  instruction: string;
  countdown?: number;
  callout?: string; // e.g., "Jab! Cross! Hook!"
}
