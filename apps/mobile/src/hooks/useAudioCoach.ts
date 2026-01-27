// Audio Coach Hook for Drill Execution
import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  speak,
  speakInstruction,
  speakComboCallout,
  speakCountdown,
  stopSpeech,
  updateSpeechSettings,
} from '@/services/speech';
import type { DrillStep } from '@/types/drill';

interface AudioCoachOptions {
  enabled?: boolean;
  countdownEnabled?: boolean;
  rate?: number;
  volume?: number;
}

export function useAudioCoach(options: AudioCoachOptions = {}) {
  const preferences = useAppStore((state) => state.preferences);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Get effective settings
  const isEnabled = options.enabled ?? (preferences as any).audioCoachingEnabled ?? true;
  const countdownEnabled = options.countdownEnabled ?? true;
  const rate = options.rate ?? 1.0;
  const volume = options.volume ?? 1.0;

  // Update speech settings when options change
  useEffect(() => {
    updateSpeechSettings({
      enabled: isEnabled,
      rate,
      volume,
    });
  }, [isEnabled, rate, volume]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopSpeech();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Speak a drill step instruction
  const speakStep = useCallback(
    async (step: DrillStep) => {
      if (!isEnabled) return;

      // Get spoken instruction (use custom if available, otherwise use regular instruction)
      const instruction = (step as any).spokenInstruction || step.instruction;
      await speakInstruction(instruction);

      // If step has tips, speak them after a pause
      if (step.tips && step.tips.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const tip = step.tips[0];
        await speak(`Tip: ${tip}`, { rate: 0.9 });
      }
    },
    [isEnabled]
  );

  // Speak punch combination
  const speakCombo = useCallback(
    async (combo: string) => {
      if (!isEnabled) return;
      await speakComboCallout(combo);
    },
    [isEnabled]
  );

  // Start countdown for a timed step
  const startCountdown = useCallback(
    (
      durationSeconds: number,
      onTick?: (remaining: number) => void,
      onComplete?: () => void
    ) => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      let remaining = durationSeconds;

      countdownRef.current = setInterval(async () => {
        remaining -= 1;

        if (onTick && isMountedRef.current) {
          onTick(remaining);
        }

        // Speak countdown for last 5 seconds
        if (countdownEnabled && remaining <= 5 && remaining > 0) {
          await speakCountdown(remaining);
        }

        if (remaining <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }

          if (onComplete && isMountedRef.current) {
            onComplete();
          }
        }
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    },
    [countdownEnabled]
  );

  // Stop countdown
  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Announce drill start
  const announceDrillStart = useCallback(
    async (drillName: string) => {
      if (!isEnabled) return;
      await speak(`Starting: ${drillName}. Let's go!`);
    },
    [isEnabled]
  );

  // Announce drill complete
  const announceDrillComplete = useCallback(async () => {
    if (!isEnabled) return;
    await speak('Great job! Drill complete.');
  }, [isEnabled]);

  // Announce next step
  const announceNextStep = useCallback(
    async (stepNumber: number, totalSteps: number) => {
      if (!isEnabled) return;
      await speak(`Step ${stepNumber} of ${totalSteps}`);
    },
    [isEnabled]
  );

  // Speak encouragement
  const speakEncouragement = useCallback(async () => {
    if (!isEnabled) return;

    const encouragements = [
      'Keep it up!',
      "You're doing great!",
      'Stay focused!',
      'Nice work!',
      'Keep pushing!',
    ];
    const random = encouragements[Math.floor(Math.random() * encouragements.length)];
    await speak(random);
  }, [isEnabled]);

  return {
    isEnabled,
    speakStep,
    speakCombo,
    startCountdown,
    stopCountdown,
    announceDrillStart,
    announceDrillComplete,
    announceNextStep,
    speakEncouragement,
    stopSpeech,
  };
}
