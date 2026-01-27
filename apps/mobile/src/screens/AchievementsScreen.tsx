// Achievements Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  useGamificationStore,
  selectXPProgress,
  selectLevelInfo,
} from '@/store/useGamificationStore';
import { ACHIEVEMENTS, getAchievementsByCategory } from '@/data/achievements';
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import type { AchievementCategory } from '@/types/gamification';

const CATEGORIES: { id: AchievementCategory; name: string; icon: string }[] = [
  { id: 'analysis', name: 'Analysis', icon: 'videocam' },
  { id: 'drills', name: 'Drills', icon: 'fitness' },
  { id: 'streaks', name: 'Streaks', icon: 'flame' },
  { id: 'scores', name: 'Scores', icon: 'star' },
  { id: 'milestones', name: 'Milestones', icon: 'trophy' },
];

export function AchievementsScreen() {
  const navigation = useNavigation();
  const xp = useGamificationStore((state) => state.xp);
  const level = useGamificationStore((state) => state.level);
  const unlockedIds = useGamificationStore((state) => state.achievements);
  const xpProgress = useGamificationStore(selectXPProgress);
  const levelInfo = useGamificationStore(selectLevelInfo);

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelBadge}>
            <Ionicons name="shield" size={32} color={colors.primary} />
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelName}>{levelInfo.name}</Text>
            <Text style={styles.xpText}>{xp} XP</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${xpProgress.percentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {xpProgress.current} / {xpProgress.required} to next level
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color={colors.accent} />
            <Text style={styles.statValue}>
              {unlockedCount}/{totalCount}
            </Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="diamond" size={24} color={colors.info} />
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* Achievement Categories */}
        {CATEGORIES.map((category) => {
          const categoryAchievements = getAchievementsByCategory(category.id);
          const unlockedInCategory = categoryAchievements.filter((a) => unlockedIds.includes(a.id));

          return (
            <View key={category.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name={category.icon as any} size={20} color={colors.textSecondary} />
                  <Text style={styles.sectionTitle}>{category.name}</Text>
                </View>
                <Text style={styles.sectionCount}>
                  {unlockedInCategory.length}/{categoryAchievements.length}
                </Text>
              </View>

              <View style={styles.achievementGrid}>
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedIds.includes(achievement.id);

                  return (
                    <View
                      key={achievement.id}
                      style={[styles.achievementCard, !isUnlocked && styles.achievementLocked]}
                    >
                      <View
                        style={[
                          styles.achievementIcon,
                          isUnlocked && styles.achievementIconUnlocked,
                        ]}
                      >
                        <Ionicons
                          name={achievement.icon as any}
                          size={28}
                          color={isUnlocked ? colors.textPrimary : colors.textTertiary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.achievementName,
                          !isUnlocked && styles.achievementNameLocked,
                        ]}
                        numberOfLines={1}
                      >
                        {achievement.name}
                      </Text>
                      <Text style={styles.achievementDescription} numberOfLines={2}>
                        {achievement.description}
                      </Text>
                      <View style={styles.achievementReward}>
                        <Ionicons
                          name="star"
                          size={12}
                          color={isUnlocked ? colors.accent : colors.textTertiary}
                        />
                        <Text
                          style={[styles.achievementXP, !isUnlocked && styles.achievementXPLocked]}
                        >
                          {achievement.xpReward} XP
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
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
  levelCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.md,
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    position: 'absolute',
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  xpText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  achievementIconUnlocked: {
    backgroundColor: colors.primary + '30',
  },
  achievementName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  achievementNameLocked: {
    color: colors.textSecondary,
  },
  achievementDescription: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    minHeight: 32,
  },
  achievementReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  achievementXP: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  achievementXPLocked: {
    color: colors.textTertiary,
  },
});
