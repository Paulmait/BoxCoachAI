// Drill Timer Component for Timed Steps
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

interface DrillTimerProps {
  duration: number; // seconds
  autoStart?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function DrillTimer({ duration, autoStart = false, onComplete, onSkip }: DrillTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setTimeRemaining(duration);
    setIsRunning(autoStart);
  }, [duration, autoStart]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            hapticSuccess();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, onComplete]);

  const handleToggle = useCallback(() => {
    hapticLight();
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    hapticLight();
    setTimeRemaining(duration);
    setIsRunning(false);
  }, [duration]);

  const handleSkip = useCallback(() => {
    hapticLight();
    setIsRunning(false);
    onSkip?.();
  }, [onSkip]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeRemaining) / duration) * 100;
  const isWarning = timeRemaining <= 10 && timeRemaining > 0;
  const isComplete = timeRemaining === 0;

  return (
    <View style={styles.container}>
      <View style={styles.timerDisplay}>
        <View style={styles.progressRing}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isWarning
                  ? colors.warning
                  : isComplete
                    ? colors.success
                    : colors.primary,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.timeText,
            isWarning && styles.timeTextWarning,
            isComplete && styles.timeTextComplete,
          ]}
        >
          {formatTime(timeRemaining)}
        </Text>
      </View>

      <View style={styles.controls}>
        {!isComplete && (
          <>
            <Pressable style={styles.controlButton} onPress={handleToggle}>
              <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.controlButton} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color={colors.textPrimary} />
            </Pressable>
          </>
        )}
        {onSkip && (
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressRing: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeText: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timeTextWarning: {
    color: colors.warning,
  },
  timeTextComplete: {
    color: colors.success,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
