// Timer Store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  TimerState,
  TimerSettings,
  TimerPreset,
  TimerPhase,
} from '@/types/timer';
import { DEFAULT_TIMER_SETTINGS, TIMER_PRESETS } from '@/types/timer';

interface TimerStore {
  // Timer state
  timerState: TimerState;
  settings: TimerSettings;
  selectedPresetId: string | null;
  workoutStartTime: Date | null;

  // Actions
  setSettings: (settings: Partial<TimerSettings>) => void;
  selectPreset: (preset: TimerPreset) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setPhase: (phase: TimerPhase) => void;
  nextRound: () => void;
  completeWorkout: () => void;
}

const initialTimerState: TimerState = {
  isRunning: false,
  currentRound: 1,
  totalRounds: DEFAULT_TIMER_SETTINGS.rounds,
  timeRemaining: DEFAULT_TIMER_SETTINGS.roundDuration,
  phase: 'idle',
  roundDuration: DEFAULT_TIMER_SETTINGS.roundDuration,
  restDuration: DEFAULT_TIMER_SETTINGS.restDuration,
  warningTime: DEFAULT_TIMER_SETTINGS.warningTime,
};

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      timerState: initialTimerState,
      settings: DEFAULT_TIMER_SETTINGS,
      selectedPresetId: null,
      workoutStartTime: null,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
          timerState: {
            ...state.timerState,
            totalRounds: newSettings.rounds ?? state.settings.rounds,
            roundDuration: newSettings.roundDuration ?? state.settings.roundDuration,
            restDuration: newSettings.restDuration ?? state.settings.restDuration,
            warningTime: newSettings.warningTime ?? state.settings.warningTime,
            timeRemaining: newSettings.roundDuration ?? state.settings.roundDuration,
          },
        })),

      selectPreset: (preset) =>
        set((state) => ({
          selectedPresetId: preset.id,
          settings: {
            ...state.settings,
            rounds: preset.rounds,
            roundDuration: preset.roundDuration,
            restDuration: preset.restDuration,
            warningTime: preset.warningTime,
          },
          timerState: {
            ...state.timerState,
            totalRounds: preset.rounds,
            roundDuration: preset.roundDuration,
            restDuration: preset.restDuration,
            warningTime: preset.warningTime,
            timeRemaining: preset.roundDuration,
            currentRound: 1,
            phase: 'idle',
            isRunning: false,
          },
        })),

      startTimer: () =>
        set((state) => ({
          timerState: {
            ...state.timerState,
            isRunning: true,
            phase: 'round',
            timeRemaining: state.settings.roundDuration,
            currentRound: 1,
          },
          workoutStartTime: new Date(),
        })),

      pauseTimer: () =>
        set((state) => ({
          timerState: {
            ...state.timerState,
            isRunning: false,
          },
        })),

      resumeTimer: () =>
        set((state) => ({
          timerState: {
            ...state.timerState,
            isRunning: true,
          },
        })),

      resetTimer: () =>
        set((state) => ({
          timerState: {
            ...initialTimerState,
            totalRounds: state.settings.rounds,
            roundDuration: state.settings.roundDuration,
            restDuration: state.settings.restDuration,
            warningTime: state.settings.warningTime,
            timeRemaining: state.settings.roundDuration,
          },
          workoutStartTime: null,
        })),

      tick: () => {
        const state = get();
        const { timerState, settings } = state;

        if (!timerState.isRunning || timerState.phase === 'idle' || timerState.phase === 'complete') {
          return;
        }

        const newTimeRemaining = timerState.timeRemaining - 1;

        // Check for phase transitions
        if (newTimeRemaining <= 0) {
          if (timerState.phase === 'round' || timerState.phase === 'warning') {
            // Round ended
            if (timerState.currentRound >= timerState.totalRounds) {
              // Workout complete
              set({
                timerState: {
                  ...timerState,
                  isRunning: false,
                  phase: 'complete',
                  timeRemaining: 0,
                },
              });
            } else {
              // Start rest period
              set({
                timerState: {
                  ...timerState,
                  phase: 'rest',
                  timeRemaining: settings.restDuration,
                },
              });
            }
          } else if (timerState.phase === 'rest') {
            // Rest ended, start next round
            set({
              timerState: {
                ...timerState,
                phase: 'round',
                currentRound: timerState.currentRound + 1,
                timeRemaining: settings.roundDuration,
              },
            });
          }
        } else {
          // Check for warning phase
          let newPhase = timerState.phase;
          if (
            timerState.phase === 'round' &&
            newTimeRemaining <= settings.warningTime
          ) {
            newPhase = 'warning';
          }

          set({
            timerState: {
              ...timerState,
              timeRemaining: newTimeRemaining,
              phase: newPhase,
            },
          });
        }
      },

      setPhase: (phase) =>
        set((state) => ({
          timerState: {
            ...state.timerState,
            phase,
          },
        })),

      nextRound: () =>
        set((state) => {
          const nextRound = state.timerState.currentRound + 1;
          if (nextRound > state.timerState.totalRounds) {
            return {
              timerState: {
                ...state.timerState,
                phase: 'complete',
                isRunning: false,
              },
            };
          }
          return {
            timerState: {
              ...state.timerState,
              currentRound: nextRound,
              phase: 'round',
              timeRemaining: state.settings.roundDuration,
            },
          };
        }),

      completeWorkout: () =>
        set((state) => ({
          timerState: {
            ...state.timerState,
            phase: 'complete',
            isRunning: false,
          },
        })),
    }),
    {
      name: 'boxcoach-timer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        selectedPresetId: state.selectedPresetId,
      }),
    }
  )
);

// Selectors
export const selectTimerState = (state: TimerStore) => state.timerState;
export const selectTimerSettings = (state: TimerStore) => state.settings;
export const selectSelectedPreset = (state: TimerStore) =>
  state.selectedPresetId
    ? TIMER_PRESETS.find((p) => p.id === state.selectedPresetId)
    : null;
export const selectIsTimerRunning = (state: TimerStore) => state.timerState.isRunning;
export const selectTimerPhase = (state: TimerStore) => state.timerState.phase;
