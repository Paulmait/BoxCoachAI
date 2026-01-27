// Round Timer Screen
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { useTimer } from '@/hooks/useTimer';
import { useTimerStore } from '@/store/useTimerStore';
import { TIMER_PRESETS } from '@/types/timer';
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';

export function TimerScreen() {
  const navigation = useNavigation();
  const { timerState, settings, formattedTime, phaseColor, getProgress } = useTimer();

  const startTimer = useTimerStore((state) => state.startTimer);
  const pauseTimer = useTimerStore((state) => state.pauseTimer);
  const resumeTimer = useTimerStore((state) => state.resumeTimer);
  const resetTimer = useTimerStore((state) => state.resetTimer);
  const selectPreset = useTimerStore((state) => state.selectPreset);
  const setSettings = useTimerStore((state) => state.setSettings);
  const selectedPresetId = useTimerStore((state) => state.selectedPresetId);

  const handleStart = useCallback(() => {
    hapticLight();
    startTimer();
  }, [startTimer]);

  const handlePause = useCallback(() => {
    hapticLight();
    pauseTimer();
  }, [pauseTimer]);

  const handleResume = useCallback(() => {
    hapticLight();
    resumeTimer();
  }, [resumeTimer]);

  const handleReset = useCallback(() => {
    hapticLight();
    resetTimer();
  }, [resetTimer]);

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      hapticLight();
      const preset = TIMER_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        selectPreset(preset);
      }
    },
    [selectPreset]
  );

  const getPhaseText = () => {
    switch (timerState.phase) {
      case 'idle':
        return 'Ready';
      case 'round':
        return `Round ${timerState.currentRound}`;
      case 'warning':
        return `Round ${timerState.currentRound}`;
      case 'rest':
        return 'Rest';
      case 'complete':
        return 'Complete!';
    }
  };

  const progress = getProgress();
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Round Timer</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <Svg width={280} height={280} style={styles.progressRing}>
              {/* Background circle */}
              <Circle
                cx={140}
                cy={140}
                r={120}
                stroke={colors.border}
                strokeWidth={8}
                fill="none"
              />
              {/* Progress circle */}
              <Circle
                cx={140}
                cy={140}
                r={120}
                stroke={phaseColor}
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 140 140)"
              />
            </Svg>
            <View style={styles.timerContent}>
              <Text style={[styles.phaseText, { color: phaseColor }]}>
                {getPhaseText()}
              </Text>
              <Text style={styles.timeText}>{formattedTime}</Text>
              <Text style={styles.roundInfo}>
                {timerState.totalRounds} rounds
              </Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {timerState.phase === 'idle' ? (
            <Pressable style={styles.primaryButton} onPress={handleStart}>
              <Ionicons name="play" size={32} color={colors.textPrimary} />
              <Text style={styles.primaryButtonText}>Start</Text>
            </Pressable>
          ) : timerState.phase === 'complete' ? (
            <Pressable style={styles.primaryButton} onPress={handleReset}>
              <Ionicons name="refresh" size={32} color={colors.textPrimary} />
              <Text style={styles.primaryButtonText}>Reset</Text>
            </Pressable>
          ) : (
            <View style={styles.activeControls}>
              {timerState.isRunning ? (
                <Pressable style={styles.pauseButton} onPress={handlePause}>
                  <Ionicons name="pause" size={28} color={colors.textPrimary} />
                </Pressable>
              ) : (
                <Pressable style={styles.playButton} onPress={handleResume}>
                  <Ionicons name="play" size={28} color={colors.textPrimary} />
                </Pressable>
              )}
              <Pressable style={styles.resetButton} onPress={handleReset}>
                <Ionicons name="stop" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Presets */}
        {timerState.phase === 'idle' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Presets</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetList}
            >
              {TIMER_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  style={[
                    styles.presetCard,
                    selectedPresetId === preset.id && styles.presetCardSelected,
                  ]}
                  onPress={() => handlePresetSelect(preset.id)}
                >
                  <Text
                    style={[
                      styles.presetName,
                      selectedPresetId === preset.id && styles.presetNameSelected,
                    ]}
                  >
                    {preset.name}
                  </Text>
                  <Text style={styles.presetDetails}>
                    {preset.rounds}x{Math.floor(preset.roundDuration / 60)} min
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Settings Quick Adjust */}
        {timerState.phase === 'idle' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Settings</Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Rounds</Text>
                <View style={styles.settingControls}>
                  <Pressable
                    style={styles.settingButton}
                    onPress={() => setSettings({ rounds: Math.max(1, settings.rounds - 1) })}
                  >
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.settingValue}>{settings.rounds}</Text>
                  <Pressable
                    style={styles.settingButton}
                    onPress={() => setSettings({ rounds: Math.min(12, settings.rounds + 1) })}
                  >
                    <Ionicons name="add" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Round Time</Text>
                <View style={styles.settingControls}>
                  <Pressable
                    style={styles.settingButton}
                    onPress={() =>
                      setSettings({
                        roundDuration: Math.max(30, settings.roundDuration - 30),
                      })
                    }
                  >
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.settingValue}>
                    {Math.floor(settings.roundDuration / 60)}:
                    {(settings.roundDuration % 60).toString().padStart(2, '0')}
                  </Text>
                  <Pressable
                    style={styles.settingButton}
                    onPress={() =>
                      setSettings({
                        roundDuration: Math.min(300, settings.roundDuration + 30),
                      })
                    }
                  >
                    <Ionicons name="add" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Rest Time</Text>
                <View style={styles.settingControls}>
                  <Pressable
                    style={styles.settingButton}
                    onPress={() =>
                      setSettings({
                        restDuration: Math.max(15, settings.restDuration - 15),
                      })
                    }
                  >
                    <Ionicons name="remove" size={20} color={colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.settingValue}>
                    {Math.floor(settings.restDuration / 60)}:
                    {(settings.restDuration % 60).toString().padStart(2, '0')}
                  </Text>
                  <Pressable
                    style={styles.settingButton}
                    onPress={() =>
                      setSettings({
                        restDuration: Math.min(120, settings.restDuration + 15),
                      })
                    }
                  >
                    <Ionicons name="add" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  timerCircle: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
  },
  timerContent: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  timeText: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  roundInfo: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...shadows.lg,
  },
  primaryButtonText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  pauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  resetButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  presetList: {
    gap: spacing.sm,
  },
  presetCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  presetName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  presetNameSelected: {
    color: colors.primary,
  },
  presetDetails: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  settingsRow: {
    gap: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 60,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
