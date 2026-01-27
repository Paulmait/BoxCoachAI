// Streak Display Component
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  hasStreakProtection?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  hasStreakProtection = false,
  compact = false,
  onPress,
}: StreakDisplayProps) {
  const Container = onPress ? Pressable : View;

  if (compact) {
    return (
      <Container style={styles.compactContainer} onPress={onPress}>
        <Ionicons
          name="flame"
          size={16}
          color={currentStreak > 0 ? colors.accent : colors.textTertiary}
        />
        <Text
          style={[
            styles.compactText,
            currentStreak > 0 && styles.compactTextActive,
          ]}
        >
          {currentStreak}
        </Text>
      </Container>
    );
  }

  return (
    <Container style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="flame"
          size={32}
          color={currentStreak > 0 ? colors.accent : colors.textTertiary}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.streakNumber}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>
          day{currentStreak !== 1 ? 's' : ''} streak
        </Text>
      </View>
      {currentStreak > 0 && hasStreakProtection && (
        <View style={styles.protectionBadge}>
          <Ionicons name="shield-checkmark" size={12} color={colors.info} />
          <Text style={styles.protectionText}>Protected</Text>
        </View>
      )}
      {longestStreak > currentStreak && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestText}>Best: {longestStreak}</Text>
        </View>
      )}
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  streakNumber: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  protectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.info + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  protectionText: {
    fontSize: fontSize.xs,
    color: colors.info,
    fontWeight: '500',
  },
  bestBadge: {
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  bestText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  compactText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  compactTextActive: {
    color: colors.accent,
  },
});
