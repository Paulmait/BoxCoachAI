// Level Progress Component
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { LEVELS } from '@/types/gamification';

interface LevelProgressProps {
  level: number;
  xp: number;
  compact?: boolean;
  onPress?: () => void;
}

export function LevelProgress({ level, xp, compact = false, onPress }: LevelProgressProps) {
  const currentLevel = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === level + 1);

  const xpInLevel = xp - currentLevel.minXP;
  const xpForLevel = nextLevel ? nextLevel.minXP - currentLevel.minXP : 0;
  const progress = nextLevel ? (xpInLevel / xpForLevel) * 100 : 100;

  const Container = onPress ? Pressable : View;

  if (compact) {
    return (
      <Container style={styles.compactContainer} onPress={onPress}>
        <View style={styles.compactLevel}>
          <Ionicons name="shield" size={14} color={colors.primary} />
          <Text style={styles.compactLevelText}>{level}</Text>
        </View>
        <Text style={styles.compactXP}>{xp} XP</Text>
      </Container>
    );
  }

  return (
    <Container style={styles.container} onPress={onPress}>
      <View style={styles.levelBadge}>
        <Ionicons name="shield" size={24} color={colors.primary} />
        <Text style={styles.levelNumber}>{level}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.levelName}>{currentLevel.name}</Text>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        {nextLevel && (
          <Text style={styles.nextLevel}>
            {xpForLevel - xpInLevel} XP to Level {level + 1}
          </Text>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    position: 'absolute',
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  xpText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  nextLevel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  compactLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactLevelText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  compactXP: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
