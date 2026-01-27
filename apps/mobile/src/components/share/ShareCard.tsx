// Share Card Component for Social Sharing
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { ScoreRing } from '@/components/ScoreRing';
import type { TechniqueAnalysis } from '@/types';

interface ShareCardProps {
  analysis: TechniqueAnalysis;
}

export const ShareCard = forwardRef<View, ShareCardProps>(({ analysis }, ref) => {
  const topImprovements = analysis.priorityImprovements.slice(0, 3);

  return (
    <View ref={ref} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="fitness" size={24} color={colors.primary} />
          <Text style={styles.logoText}>Boxing Coach AI</Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreSection}>
        <ScoreRing score={analysis.overallScore} size={140} />
        <Text style={styles.scoreLabel}>Overall Score</Text>
      </View>

      {/* Technique Scores */}
      <View style={styles.scoresGrid}>
        {analysis.techniqueScores.slice(0, 4).map((score) => (
          <View key={score.category} style={styles.scoreItem}>
            <Text style={styles.scoreName}>{score.category}</Text>
            <Text style={styles.scoreValue}>{score.score}</Text>
          </View>
        ))}
      </View>

      {/* Areas to Improve */}
      {topImprovements.length > 0 && (
        <View style={styles.improvementsSection}>
          <Text style={styles.improvementsTitle}>Focus Areas</Text>
          {topImprovements.map((improvement, index) => (
            <View key={index} style={styles.improvementItem}>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              <Text style={styles.improvementText}>{improvement}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Analyzed on {new Date(analysis.analyzedAt).toLocaleDateString()}
        </Text>
        <Text style={styles.watermark}>boxcoach.ai</Text>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  scoreItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  scoreName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  scoreValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  improvementsSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  improvementsTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  improvementText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  watermark: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});
