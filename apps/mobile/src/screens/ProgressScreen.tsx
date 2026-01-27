import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '@/store/useAppStore';
import { ScoreRing } from '@/components/ScoreRing';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export function ProgressScreen() {
  const analysisHistory = useAppStore((state) => state.analysisHistory);
  const isPremium = useAppStore((state) => state.isPremium);

  const averageScore =
    analysisHistory.length > 0
      ? Math.round(
          analysisHistory.reduce((acc, a) => acc + a.overallScore, 0) / analysisHistory.length
        )
      : 0;

  const latestScore = analysisHistory[0]?.overallScore || 0;
  const firstScore = analysisHistory[analysisHistory.length - 1]?.overallScore || 0;
  const improvement =
    analysisHistory.length > 1 ? latestScore - firstScore : 0;

  const recentScores = analysisHistory.slice(0, 10).reverse();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ScoreRing score={averageScore} size={80} strokeWidth={8} />
            <Text style={styles.statLabel}>Average Score</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analysisHistory.length}</Text>
            <Text style={styles.statLabel}>Total Analyses</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.improvementContainer}>
              <Ionicons
                name={improvement >= 0 ? 'arrow-up' : 'arrow-down'}
                size={24}
                color={improvement >= 0 ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.improvementValue,
                  { color: improvement >= 0 ? colors.success : colors.error },
                ]}
              >
                {Math.abs(improvement)}
              </Text>
            </View>
            <Text style={styles.statLabel}>Improvement</Text>
          </View>
        </View>

        {/* Score Trend */}
        {recentScores.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Score Trend</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chart}>
                {recentScores.map((analysis, index) => {
                  const barHeight = (analysis.overallScore / 100) * 120;
                  return (
                    <View key={index} style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor:
                              analysis.overallScore >= 80
                                ? colors.success
                                : analysis.overallScore >= 60
                                  ? colors.warning
                                  : colors.error,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>
                        {new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Technique Breakdown */}
        {analysisHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Technique Scores</Text>
            {analysisHistory[0]?.techniqueScores.map((technique, index) => (
              <View key={index} style={styles.techniqueRow}>
                <Text style={styles.techniqueName}>
                  {technique.category.replace('_', ' ')}
                </Text>
                <View style={styles.techniqueBarContainer}>
                  <View
                    style={[
                      styles.techniqueBar,
                      { width: `${technique.score}%` },
                    ]}
                  />
                </View>
                <Text style={styles.techniqueScore}>{technique.score}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Analysis History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Analyses</Text>
          {analysisHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No analyses yet</Text>
              <Text style={styles.emptySubtext}>
                Record your first video to start tracking your progress
              </Text>
            </View>
          ) : (
            analysisHistory.slice(0, 5).map((analysis, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyScore}>
                  <Text style={styles.historyScoreValue}>{analysis.overallScore}</Text>
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyDate}>
                    {new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.historySummary} numberOfLines={2}>
                    {analysis.summary}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            ))
          )}
        </View>

        {/* Premium Upsell */}
        {!isPremium && (
          <View style={styles.premiumCard}>
            <View style={styles.premiumContent}>
              <Ionicons name="star" size={32} color={colors.accent} />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Unlock Unlimited Analysis</Text>
                <Text style={styles.premiumSubtitle}>
                  Get detailed progress tracking and unlimited analyses
                </Text>
              </View>
            </View>
            <Pressable style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Upgrade</Text>
            </Pressable>
          </View>
        )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  improvementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  improvementValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
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
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  barLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  techniqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  techniqueName: {
    width: 100,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  techniqueBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  techniqueBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  techniqueScore: {
    width: 30,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyScore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyScoreValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  historyContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  historyDate: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  historySummary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  premiumCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  premiumSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  premiumButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  premiumButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.background,
  },
});
