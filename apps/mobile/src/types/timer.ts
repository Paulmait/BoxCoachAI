// Timer Types

export interface TimerPreset {
  id: string;
  name: string;
  rounds: number;
  roundDuration: number; // seconds
  restDuration: number; // seconds
  warningTime: number; // seconds before round ends
}

export type TimerPhase = 'idle' | 'round' | 'rest' | 'warning' | 'complete';

export interface TimerState {
  isRunning: boolean;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number; // seconds
  phase: TimerPhase;
  roundDuration: number;
  restDuration: number;
  warningTime: number;
}

export interface TimerSettings {
  rounds: number;
  roundDuration: number; // seconds
  restDuration: number; // seconds
  warningTime: number; // seconds
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  rounds: 3,
  roundDuration: 180, // 3 minutes
  restDuration: 60, // 1 minute
  warningTime: 10,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const TIMER_PRESETS: TimerPreset[] = [
  {
    id: 'shadowboxing',
    name: 'Shadowboxing',
    rounds: 3,
    roundDuration: 180,
    restDuration: 60,
    warningTime: 10,
  },
  {
    id: 'bag_work',
    name: 'Bag Work',
    rounds: 6,
    roundDuration: 180,
    restDuration: 60,
    warningTime: 10,
  },
  {
    id: 'sparring',
    name: 'Sparring',
    rounds: 3,
    roundDuration: 120,
    restDuration: 60,
    warningTime: 10,
  },
  {
    id: 'hiit',
    name: 'HIIT',
    rounds: 8,
    roundDuration: 30,
    restDuration: 30,
    warningTime: 5,
  },
  {
    id: 'endurance',
    name: 'Endurance',
    rounds: 12,
    roundDuration: 180,
    restDuration: 30,
    warningTime: 10,
  },
];
