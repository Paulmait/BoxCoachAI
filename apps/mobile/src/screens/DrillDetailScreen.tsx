import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { drillLibrary } from '@/data/drillLibrary';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { DrillStackScreenProps } from '@/navigation/types';

type NavigationProp = DrillStackScreenProps<'DrillDetail'>['navigation'];
type RouteProp = DrillStackScreenProps<'DrillDetail'>['route'];

export function DrillDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { drillId } = route.params;

  const [isStarted, setIsStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const drill = drillLibrary.find((d) => d.id === drillId);

  if (!drill) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Drill not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStart = () => {
    setIsStarted(true);
    setCurrentStepIndex(0);
  };

  const handleComplete = () => {
    Alert.alert('Drill Completed!', 'Great work! Keep practicing to improve your technique.', [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  const currentStep = drill.steps[currentStepIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {drill.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!isStarted ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Drill Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
                <Text style={styles.infoValue}>{drill.duration} min</Text>
                <Text style={styles.infoLabel}>Duration</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Ionicons name="fitness-outline" size={24} color={colors.primary} />
                <Text style={styles.infoValue}>{drill.difficulty}</Text>
                <Text style={styles.infoLabel}>Difficulty</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Ionicons name="list-outline" size={24} color={colors.primary} />
                <Text style={styles.infoValue}>{drill.steps.length}</Text>
                <Text style={styles.infoLabel}>Steps</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{drill.description}</Text>
          </View>

          {/* Equipment */}
          {drill.equipment.length > 0 && drill.equipment[0] !== 'none' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment Needed</Text>
              <View style={styles.equipmentList}>
                {drill.equipment.map((eq, index) => (
                  <View key={index} style={styles.equipmentItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.equipmentText}>{eq.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tips */}
          {drill.tips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tips</Text>
              <View style={styles.tipsList}>
                {drill.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="bulb" size={16} color={colors.accent} />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Common Mistakes */}
          {drill.commonMistakes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Common Mistakes to Avoid</Text>
              <View style={styles.mistakesList}>
                {drill.commonMistakes.map((mistake, index) => (
                  <View key={index} style={styles.mistakeItem}>
                    <Ionicons name="close-circle" size={16} color={colors.error} />
                    <Text style={styles.mistakeText}>{mistake}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.practiceContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStepIndex + 1) / drill.steps.length) * 100}%` },
              ]}
            />
          </View>

          <Text style={styles.stepCounter}>
            Step {currentStepIndex + 1} of {drill.steps.length}
          </Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepInstruction}>{currentStep?.instruction}</Text>
            {currentStep?.reps && <Text style={styles.stepDetail}>Reps: {currentStep.reps}</Text>}
            {currentStep?.duration && (
              <Text style={styles.stepDetail}>Duration: {currentStep.duration}s</Text>
            )}
            {currentStep?.tips && currentStep.tips.length > 0 && (
              <View style={styles.stepTips}>
                {currentStep.tips.map((tip, index) => (
                  <Text key={index} style={styles.stepTipText}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <View style={styles.stepNavigation}>
            {currentStepIndex > 0 && (
              <Pressable
                style={styles.navButton}
                onPress={() => setCurrentStepIndex(currentStepIndex - 1)}
              >
                <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={styles.navButtonText}>Previous</Text>
              </Pressable>
            )}
            <View style={styles.navSpacer} />
            {currentStepIndex < drill.steps.length - 1 ? (
              <Pressable
                style={[styles.navButton, styles.navButtonPrimary]}
                onPress={() => setCurrentStepIndex(currentStepIndex + 1)}
              >
                <Text style={styles.navButtonTextPrimary}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textPrimary} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.navButton, styles.navButtonSuccess]}
                onPress={handleComplete}
              >
                <Text style={styles.navButtonTextPrimary}>Complete</Text>
                <Ionicons name="checkmark" size={20} color={colors.textPrimary} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {!isStarted && (
        <View style={styles.footer}>
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Ionicons name="play" size={24} color={colors.textPrimary} />
            <Text style={styles.startButtonText}>Start Drill</Text>
          </Pressable>
        </View>
      )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  infoValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    textTransform: 'capitalize',
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
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
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  equipmentList: {
    gap: spacing.sm,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  equipmentText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  tipsList: {
    gap: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  mistakesList: {
    gap: spacing.sm,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  mistakeText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  practiceContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  stepCounter: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  stepCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  stepInstruction: {
    fontSize: fontSize.xxl,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  stepDetail: {
    fontSize: fontSize.lg,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  stepTips: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepTipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  stepNavigation: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  navSpacer: {
    flex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  navButtonPrimary: {
    backgroundColor: colors.primary,
  },
  navButtonSuccess: {
    backgroundColor: colors.success,
  },
  navButtonText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  navButtonTextPrimary: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
});
