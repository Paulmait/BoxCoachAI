// Combo Randomizer Screen
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { generateCombo, getComboCallout } from '@/utils/comboGenerator';
import { speakComboCallout, stopSpeech } from '@/services/speech';
import { hapticMedium, hapticLight } from '@/utils/haptics';
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import type { Combo, ComboConfig, DifficultyPreset } from '@/types/combo';
import { COMBO_PRESETS, DEFAULT_COMBO_CONFIG } from '@/types/combo';

export function ComboRandomizerScreen() {
  const navigation = useNavigation();
  const [isRunning, setIsRunning] = useState(false);
  const [currentCombo, setCurrentCombo] = useState<Combo | null>(null);
  const [config, setConfig] = useState<ComboConfig>(DEFAULT_COMBO_CONFIG);
  const [difficulty, setDifficulty] = useState<DifficultyPreset>('intermediate');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopSpeech();
    };
  }, []);

  // Animate combo display
  const animateCombo = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  // Generate new combo
  const generateNewCombo = useCallback(async () => {
    hapticMedium();
    const combo = generateCombo(config);
    setCurrentCombo(combo);
    animateCombo();

    if (config.audioEnabled) {
      const callout = getComboCallout(combo);
      await speakComboCallout(callout);
    }
  }, [config, animateCombo]);

  // Start continuous mode
  const startContinuous = useCallback(() => {
    hapticLight();
    setIsRunning(true);
    generateNewCombo();

    intervalRef.current = setInterval(() => {
      generateNewCombo();
    }, config.interval * 1000);
  }, [config.interval, generateNewCombo]);

  // Stop continuous mode
  const stopContinuous = useCallback(() => {
    hapticLight();
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopSpeech();
  }, []);

  // Change difficulty
  const handleDifficultyChange = useCallback((preset: DifficultyPreset) => {
    hapticLight();
    setDifficulty(preset);
    setConfig(COMBO_PRESETS[preset]);
    if (isRunning) {
      stopContinuous();
    }
    setCurrentCombo(null);
  }, [isRunning, stopContinuous]);

  // Manual trigger
  const handleManualCombo = useCallback(() => {
    if (!isRunning) {
      generateNewCombo();
    }
  }, [isRunning, generateNewCombo]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Combo Randomizer</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Difficulty Selector */}
        <View style={styles.difficultyRow}>
          {(['beginner', 'intermediate', 'advanced'] as DifficultyPreset[]).map(
            (preset) => (
              <Pressable
                key={preset}
                style={[
                  styles.difficultyButton,
                  difficulty === preset && styles.difficultyButtonActive,
                ]}
                onPress={() => handleDifficultyChange(preset)}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    difficulty === preset && styles.difficultyTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* Combo Display */}
        <Pressable
          style={styles.comboDisplay}
          onPress={handleManualCombo}
          disabled={isRunning}
        >
          <Animated.View
            style={[
              styles.comboContent,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            {currentCombo ? (
              <>
                <Text style={styles.comboNumbers}>
                  {currentCombo.displayNumbers}
                </Text>
                <Text style={styles.comboNames}>
                  {currentCombo.displayNames}
                </Text>
              </>
            ) : (
              <Text style={styles.comboPlaceholder}>
                {isRunning ? 'Get ready...' : 'Tap to generate'}
              </Text>
            )}
          </Animated.View>
        </Pressable>

        {/* Punch List */}
        {currentCombo && (
          <View style={styles.punchList}>
            {currentCombo.punches.map((punch, index) => (
              <View key={index} style={styles.punchItem}>
                <View style={styles.punchNumber}>
                  <Text style={styles.punchNumberText}>{punch.number}</Text>
                </View>
                <Text style={styles.punchName}>{punch.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {isRunning ? (
            <Pressable style={styles.stopButton} onPress={stopContinuous}>
              <Ionicons name="stop" size={32} color={colors.textPrimary} />
              <Text style={styles.stopButtonText}>Stop</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.startButton} onPress={startContinuous}>
              <Ionicons name="play" size={32} color={colors.textPrimary} />
              <Text style={styles.startButtonText}>Start Continuous</Text>
            </Pressable>
          )}
        </View>

        {/* Settings Preview */}
        <View style={styles.settingsPreview}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Punches</Text>
            <Text style={styles.settingValue}>
              {config.minPunches}-{config.maxPunches}
            </Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Interval</Text>
            <Text style={styles.settingValue}>{config.interval}s</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Audio</Text>
            <Pressable
              onPress={() => setConfig((c) => ({ ...c, audioEnabled: !c.audioEnabled }))}
            >
              <Ionicons
                name={config.audioEnabled ? 'volume-high' : 'volume-mute'}
                size={24}
                color={config.audioEnabled ? colors.primary : colors.textTertiary}
              />
            </Pressable>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to use:</Text>
          <Text style={styles.instructionText}>
            1. Choose your difficulty level
          </Text>
          <Text style={styles.instructionText}>
            2. Tap "Start Continuous" for automatic combos
          </Text>
          <Text style={styles.instructionText}>
            3. Or tap the display for manual combos
          </Text>
          <Text style={styles.instructionText}>
            4. Throw the combo when called!
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  difficultyRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary,
  },
  difficultyText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  difficultyTextActive: {
    color: colors.textPrimary,
  },
  comboDisplay: {
    flex: 1,
    maxHeight: 300,
    marginVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  comboContent: {
    alignItems: 'center',
  },
  comboNumbers: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 8,
  },
  comboNames: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  comboPlaceholder: {
    fontSize: fontSize.xl,
    color: colors.textTertiary,
  },
  punchList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  punchItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  punchNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchNumberText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  punchName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  controls: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  startButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  stopButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingsPreview: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  settingItem: {
    flex: 1,
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  settingValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  instructions: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  instructionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
