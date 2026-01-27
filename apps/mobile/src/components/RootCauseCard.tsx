import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { RootCauseAnalysis } from '@/types';

interface RootCauseCardProps {
  rootCause: RootCauseAnalysis;
}

export function RootCauseCard({ rootCause }: RootCauseCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.textTertiary;
    }
  };

  const formatCauseName = (cause: string) => {
    return cause
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(rootCause.severity) + '20' },
          ]}
        >
          <View
            style={[styles.severityDot, { backgroundColor: getSeverityColor(rootCause.severity) }]}
          />
          <Text
            style={[styles.severityText, { color: getSeverityColor(rootCause.severity) }]}
          >
            {rootCause.severity} priority
          </Text>
        </View>
      </View>

      <Text style={styles.causeName}>{formatCauseName(rootCause.cause)}</Text>
      <Text style={styles.description}>{rootCause.description}</Text>

      <View style={styles.impactSection}>
        <Ionicons name="warning" size={16} color={colors.warning} />
        <Text style={styles.impactText}>
          <Text style={styles.impactLabel}>Impact: </Text>
          {rootCause.impact}
        </Text>
      </View>

      {rootCause.recommendedDrills.length > 0 && (
        <View style={styles.drillsSection}>
          <Text style={styles.drillsLabel}>Recommended Drills:</Text>
          <View style={styles.drillTags}>
            {rootCause.recommendedDrills.map((drillId, index) => (
              <View key={index} style={styles.drillTag}>
                <Text style={styles.drillTagText}>
                  {drillId.replace('_', ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  causeName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  impactSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.md,
  },
  impactText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  impactLabel: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  drillsSection: {
    marginTop: spacing.md,
  },
  drillsLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  drillTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  drillTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  drillTagText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
