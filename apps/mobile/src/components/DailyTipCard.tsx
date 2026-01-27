import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDailyTip } from '@/data/boxingTips';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

interface DailyTipCardProps {
  onPress?: () => void;
}

export function DailyTipCard({ onPress }: DailyTipCardProps) {
  const tip = getDailyTip();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fundamentals':
        return colors.primary;
      case 'offense':
        return colors.error;
      case 'defense':
        return colors.success;
      case 'conditioning':
        return colors.warning;
      case 'mental':
        return '#9B59B6';
      case 'strategy':
        return '#3498DB';
      default:
        return colors.textSecondary;
    }
  };

  const categoryColor = getCategoryColor(tip.category);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons name={tip.icon as any} size={24} color={categoryColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.label}>Daily Tip</Text>
          <Text style={[styles.category, { color: categoryColor }]}>
            {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
          </Text>
        </View>
        <Ionicons name="bulb" size={20} color={colors.warning} />
      </View>

      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.tipText}>{tip.tip}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  category: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
