// Training Plans Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTrainingStore } from '@/store/useTrainingStore';
import { useAppStore } from '@/store/useAppStore';
import { TRAINING_PLANS, getFreePlans, getPremiumPlans } from '@/data/trainingPlans';
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';
import type { TrainingPlan } from '@/types/trainingPlan';

export function TrainingPlansScreen() {
  const navigation = useNavigation<any>();
  const isPremium = useAppStore((state) => state.isPremium);
  const activePlan = useTrainingStore((state) => state.activePlan);
  const startPlan = useTrainingStore((state) => state.startPlan);
  const getPlanProgress = useTrainingStore((state) => state.getPlanProgress);

  const freePlans = getFreePlans();
  const premiumPlans = getPremiumPlans();

  const handlePlanPress = (plan: TrainingPlan) => {
    hapticLight();

    if (plan.isPremium && !isPremium) {
      navigation.navigate('Home', { screen: 'Paywall', params: { source: 'feature_locked' } });
      return;
    }

    navigation.navigate('PlanDetail', { planId: plan.id });
  };

  const handleStartPlan = (plan: TrainingPlan) => {
    hapticLight();

    if (plan.isPremium && !isPremium) {
      navigation.navigate('Home', { screen: 'Paywall', params: { source: 'feature_locked' } });
      return;
    }

    startPlan(plan.id);
    navigation.navigate('ActivePlan');
  };

  const renderPlanCard = (plan: TrainingPlan) => {
    const isActive = activePlan?.planId === plan.id;
    const isLocked = plan.isPremium && !isPremium;

    return (
      <Pressable
        key={plan.id}
        style={[styles.planCard, isActive && styles.planCardActive]}
        onPress={() => handlePlanPress(plan)}
      >
        <View style={styles.planHeader}>
          <View style={styles.planBadges}>
            <View
              style={[
                styles.difficultyBadge,
                plan.difficulty === 'beginner' && styles.difficultyBeginner,
                plan.difficulty === 'intermediate' && styles.difficultyIntermediate,
                plan.difficulty === 'advanced' && styles.difficultyAdvanced,
              ]}
            >
              <Text style={styles.difficultyText}>{plan.difficulty}</Text>
            </View>
            {plan.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color={colors.accent} />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>
          {isLocked && <Ionicons name="lock-closed" size={20} color={colors.textTertiary} />}
        </View>

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planDescription} numberOfLines={2}>
          {plan.description}
        </Text>

        <View style={styles.planMeta}>
          <View style={styles.planMetaItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.planMetaText}>{plan.duration} weeks</Text>
          </View>
          <View style={styles.planMetaItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.planMetaText}>
              {plan.weeks.reduce((sum, w) => sum + w.days.filter((d) => !d.isRestDay).length, 0)}{' '}
              training days
            </Text>
          </View>
        </View>

        {isActive && (
          <View style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.activeText}>In Progress</Text>
          </View>
        )}

        {!isActive && !isLocked && (
          <Pressable
            style={styles.startButton}
            onPress={(e) => {
              e.stopPropagation?.();
              handleStartPlan(plan);
            }}
          >
            <Text style={styles.startButtonText}>Start Plan</Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Training Plans</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Plan Summary */}
        {activePlan && (
          <Pressable style={styles.activeCard} onPress={() => navigation.navigate('ActivePlan')}>
            <View style={styles.activeCardHeader}>
              <Text style={styles.activeCardTitle}>Current Plan</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            {(() => {
              const plan = TRAINING_PLANS.find((p) => p.id === activePlan.planId);
              const progress = getPlanProgress();
              return (
                <>
                  <Text style={styles.activeCardPlanName}>{plan?.name}</Text>
                  <View style={styles.activeCardProgress}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress?.percentComplete || 0}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{progress?.percentComplete}% complete</Text>
                  </View>
                </>
              );
            })()}
          </Pressable>
        )}

        {/* Free Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Plans</Text>
          {freePlans.map(renderPlanCard)}
        </View>

        {/* Premium Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Plans</Text>
          {premiumPlans.map(renderPlanCard)}
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
  activeCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginBottom: spacing.lg,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeCardTitle: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  activeCardPlanName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  activeCardProgress: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  planCardActive: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  planBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  difficultyBeginner: {
    backgroundColor: colors.success + '20',
  },
  difficultyIntermediate: {
    backgroundColor: colors.warning + '20',
  },
  difficultyAdvanced: {
    backgroundColor: colors.error + '20',
  },
  difficultyText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent + '20',
    borderRadius: borderRadius.sm,
  },
  premiumText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent,
  },
  planName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  planDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  planMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  planMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  planMetaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  startButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
