// Timer Hook with Background Support
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTimerStore, selectTimerState, selectTimerSettings } from '@/store/useTimerStore';
import { playTimerTransition } from '@/services/audio';
import { hapticRoundStart, hapticRoundEnd, hapticWarningAlert } from '@/utils/haptics';
import type { TimerPhase } from '@/types/timer';

export function useTimer() {
  const timerState = useTimerStore(selectTimerState);
  const settings = useTimerStore(selectTimerSettings);
  const tick = useTimerStore((state) => state.tick);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPhaseRef = useRef<TimerPhase>(timerState.phase);
  const backgroundTimeRef = useRef<number | null>(null);

  // Handle phase transitions
  useEffect(() => {
    const prevPhase = lastPhaseRef.current;
    const currentPhase = timerState.phase;

    if (prevPhase !== currentPhase) {
      // Play sound and haptic for phase transition
      if (settings.soundEnabled) {
        playTimerTransition(prevPhase, currentPhase);
      }

      if (settings.vibrationEnabled) {
        if (currentPhase === 'round') {
          hapticRoundStart();
        } else if (currentPhase === 'rest' || currentPhase === 'complete') {
          hapticRoundEnd();
        } else if (currentPhase === 'warning') {
          hapticWarningAlert();
        }
      }

      lastPhaseRef.current = currentPhase;
    }
  }, [timerState.phase, settings.soundEnabled, settings.vibrationEnabled]);

  // Timer interval
  useEffect(() => {
    if (timerState.isRunning) {
      // Keep screen awake
      activateKeepAwakeAsync('timer');

      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      // Allow screen to sleep
      deactivateKeepAwake('timer');

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      deactivateKeepAwake('timer');
    };
  }, [timerState.isRunning, tick]);

  // Handle background/foreground transitions
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && timerState.isRunning) {
        // App going to background - store current time
        backgroundTimeRef.current = Date.now();
      } else if (nextAppState === 'active' && backgroundTimeRef.current && timerState.isRunning) {
        // App coming back to foreground - calculate elapsed time
        const elapsedSeconds = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        backgroundTimeRef.current = null;

        // Apply elapsed time (multiple ticks)
        for (let i = 0; i < elapsedSeconds; i++) {
          tick();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [timerState.isRunning, tick]);

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage for circular display
  const getProgress = useCallback((): number => {
    if (timerState.phase === 'idle' || timerState.phase === 'complete') {
      return timerState.phase === 'complete' ? 100 : 0;
    }

    const totalTime =
      timerState.phase === 'round' || timerState.phase === 'warning'
        ? settings.roundDuration
        : settings.restDuration;

    return ((totalTime - timerState.timeRemaining) / totalTime) * 100;
  }, [timerState, settings]);

  // Get color based on phase
  const getPhaseColor = useCallback((): string => {
    switch (timerState.phase) {
      case 'round':
        return '#22C55E'; // green
      case 'warning':
        return '#F59E0B'; // amber
      case 'rest':
        return '#3B82F6'; // blue
      case 'complete':
        return '#EF4444'; // red
      default:
        return '#A1A1AA'; // gray
    }
  }, [timerState.phase]);

  return {
    timerState,
    settings,
    formatTime,
    getProgress,
    getPhaseColor,
    formattedTime: formatTime(timerState.timeRemaining),
    progress: getProgress(),
    phaseColor: getPhaseColor(),
  };
}
