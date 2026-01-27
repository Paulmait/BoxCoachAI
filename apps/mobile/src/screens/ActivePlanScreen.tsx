// Active Training Plan Screen
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTrainingStore } from '@/store/useTrainingStore';
import { TRAINING_PLANS } from '@/data/trainingPlans';
import { getDrillById } from '@/data/drillLibrary';
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';

export function ActivePlanScreen() {
  const navigation = useNavigation<any>();
  const activePlan = useTrainingStore((state) => state.activePlan);
  const completeDay = useTrainingStore((state) => state.completeDay);
  const skipDay = useTrainingStore((state) => state.skipDay);
  const cancelPlan = useTrainingStore((state) => state.cancelPlan);
  const getPlanProgress = useTrainingStore((state) => state.getPlanProgress);
  const getTodayTraining = useTrainingStore((state) => state.getTodayTraining);
  const isCurrentDayCompleted = useTrainingStore((state) => state.isCurrentDayCompleted);

  const plan = activePlan
    ? TRAINING_PLANS.find((p) => p.id === activePlan.planId)
    : null;
  const progress = getPlanProgress();
  const todayTraining = getTodayTraining();
  const isDayCompleted = isCurrentDayCompleted();

  const handleDrillPress = useCallback(
    (drillId: string) => {
      hapticLight();
      navigation.navigate('Drills', {
        screen: 'DrillDetail',
        params: { drillId },
      });
    },
    [navigation]
  );

  const handleCompleteDay = useCallback(() => {
    hapticLight();
    if (todayTraining) {
      completeDay(todayTraining.drillIds, todayTraining.drillIds.length * 10);
    }
  }, [completeDay, todayTraining]);

  const handleSkipDay = useCallback(() => {
    Alert.alert(
      'Skip Day',
      'Are you sure you want to skip today? This will count as a missed day.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            hapticLight();
            skipDay();
          },
        },
      ]
    );
  }, [skipDay]);

  const handleCancelPlan = useCallback(() => {
    Alert.alert(
      'Cancel Plan',
      'Are you sure you want to cancel this training plan? Your progress will be lost.',
      [
        { text: 'Keep Training', style: 'cancel' },
        {
          text: 'Cancel Plan',
          style: 'destructive',
          onPress: () => {
            hapticLight();
            cancelPlan();
            navigation.goBack();
          },
        },
      ]
    );
  }, [cancelPlan, navigation]);

  if (!activePlan || !plan || !todayTraining) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Active Plan</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No active training plan</Text>
          <Pressable
            style={styles.browsePlansButton}
            onPress={() => navigation.navigate('TrainingPlans')}
          >
            <Text style={styles.browsePlansText}>Browse Training Plans</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentWeek = plan.weeks[activePlan.currentWeek - 1];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{plan.name}</Text>
        <Pressable onPress={handleCancelPlan} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.weekLabel}>Week {activePlan.currentWeek}</Text>
              <Text style={styles.weekName}>{currentWeek?.name}</Text>
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressPercent}>{progress?.percentComplete}%</Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress?.percentComplete || 0}%` },
              ]}
            />
          </View>
          <View style={styles.progressMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="flame" size={16} color={colors.accent} />
              <Text style={styles.metaText}>{progress?.currentStreak || 0} day streak</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.metaText}>
                {progress?.completedDays || 0}/{progress?.totalDays || 0} days
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Training */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Training</Text>
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View>
                <Text style={styles.todayDay}>{todayTraining.dayName}</Text>
                <Text style={styles.todaySubtitle}>
                  Week {todayTraining.weekNumber}, Day {todayTraining.dayNumber}
                </Text>
              </View>
              {isDayCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                  <Text style={styles.completedText}>Done</Text>
                </View>
              )}
            </View>

            {todayTraining.isRestDay ? (
              <View style={styles.restDay}>
                <Ionicons name="bed-outline" size={32} color={colors.textTertiary} />
                <Text style={styles.restDayText}>Rest Day</Text>
                <Text style={styles.restDaySubtext}>
                  Take it easy and recover for tomorrow
                </Text>
              </View>
            ) : (
              <View style={styles.drillsList}>
                {todayTraining.drillIds.map((drillId, index) => {
                  const drill = getDrillById(drillId);
                  if (!drill) return null;

                  return (
                    <Pressable
                      key={drillId}
                      style={styles.drillItem}
                      onPress={() => handleDrillPress(drillId)}
                    >
                      <View style={styles.drillNumber}>
                        <Text style={styles.drillNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.drillInfo}>
                        <Text style={styles.drillName}>{drill.name}</Text>
                        <Text style={styles.drillDuration}>~{drill.duration} min</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textTertiary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {todayTraining.notes && (
              <View style={styles.notesContainer}>
                <Ionicons name="information-circle-outline" size={16} color={colors.info} />
                <Text style={styles.notesText}>{todayTraining.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {!todayTraining.isRestDay && !isDayCompleted && (
          <View style={styles.actions}>
            <Pressable style={styles.completeButton} onPress={handleCompleteDay}>
              <Ionicons name="checkmark-circle" size={24} color={colors.textPrimary} />
              <Text style={styles.completeButtonText}>Complete Day</Text>
            </Pressable>
            <Pressable style={styles.skipButton} onPress={handleSkipDay}>
              <Text style={styles.skipButtonText}>Skip Day</Text>
            </Pressable>
          </View>
        )}

        {/* Week Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekOverview}>
            {currentWeek?.days.map((day, index) => {
              const isToday = index + 1 === activePlan.currentDay;
              const isCompleted = activePlan.completedDays.some(
                (d) =>
                  d.weekNumber === activePlan.currentWeek && d.dayNumber === index + 1
              );

              return (
                <View
                  key={index}
                  style={[
                    styles.dayIndicator,
                    isToday && styles.dayIndicatorToday,
                    isCompleted && styles.dayIndicatorCompleted,
                    day.isRestDay && styles.dayIndicatorRest,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
                  ) : day.isRestDay ? (
                    <Ionicons name="remove" size={16} color={colors.textTertiary} />
                  ) : (
                    <Text
                      style={[
                        styles.dayIndicatorText,
                        isToday && styles.dayIndicatorTextToday,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
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
  menuButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  browsePlansButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  browsePlansText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  weekLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  weekName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  progressStats: {
    alignItems: 'flex-end',
  },
  progressPercent: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  todayDay: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  todaySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  completedText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
  },
  restDay: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  restDayText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  restDaySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  drillsList: {
    gap: spacing.sm,
  },
  drillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  drillNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drillNumberText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  drillInfo: {
    flex: 1,
  },
  drillName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  drillDuration: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  notesText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.info,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  completeButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  weekOverview: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  dayIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndicatorToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayIndicatorCompleted: {
    backgroundColor: colors.success,
  },
  dayIndicatorRest: {
    backgroundColor: colors.backgroundTertiary,
  },
  dayIndicatorText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayIndicatorTextToday: {
    color: colors.primary,
  },
});
