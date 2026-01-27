import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore, selectRemainingAnalyses, selectCanAnalyze } from '@/store/useAppStore';
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import { ScoreRing } from '@/components/ScoreRing';
import type { HomeStackScreenProps } from '@/navigation/types';

type NavigationProp = HomeStackScreenProps<'HomeMain'>['navigation'];

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAppStore((state) => state.user);
  const isPremium = useAppStore((state) => state.isPremium);
  const analysisHistory = useAppStore((state) => state.analysisHistory);
  const remainingAnalyses = useAppStore(selectRemainingAnalyses);
  const canAnalyze = useAppStore(selectCanAnalyze);

  const latestAnalysis = analysisHistory[0];

  const handleAnalyze = () => {
    if (!canAnalyze) {
      navigation.navigate('Paywall', { source: 'limit_reached' });
      return;
    }
    navigation.navigate('Record');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back{user?.profile?.displayName ? `, ${user.profile.displayName}` : ''}
            </Text>
            <Text style={styles.subtitle}>Ready to improve your technique?</Text>
          </View>
          {!isPremium && (
            <Pressable
              style={styles.premiumBadge}
              onPress={() => navigation.navigate('Paywall', { source: 'settings' })}
            >
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.premiumBadgeText}>Upgrade</Text>
            </Pressable>
          )}
        </View>

        {/* Analyze CTA */}
        <Pressable style={styles.analyzeCard} onPress={handleAnalyze}>
          <View style={styles.analyzeContent}>
            <View style={styles.analyzeIcon}>
              <Ionicons name="videocam" size={32} color={colors.textPrimary} />
            </View>
            <View style={styles.analyzeText}>
              <Text style={styles.analyzeTitle}>Analyze Your Technique</Text>
              <Text style={styles.analyzeSubtitle}>
                {isPremium
                  ? 'Unlimited analyses available'
                  : `${remainingAnalyses} free ${remainingAnalyses === 1 ? 'analysis' : 'analyses'} remaining today`}
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </Pressable>

        {/* Latest Analysis */}
        {latestAnalysis ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
              <Pressable onPress={() => navigation.navigate('Results', { analysisId: latestAnalysis.id })}>
                <Text style={styles.sectionLink}>View Details</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.analysisCard}
              onPress={() => navigation.navigate('Results', { analysisId: latestAnalysis.id })}
            >
              <View style={styles.analysisScoreContainer}>
                <ScoreRing score={latestAnalysis.overallScore} size={80} />
              </View>
              <View style={styles.analysisInfo}>
                <Text style={styles.analysisScore}>Overall Score</Text>
                <Text style={styles.analysisDate}>
                  {new Date(latestAnalysis.analyzedAt).toLocaleDateString()}
                </Text>
                <View style={styles.analysisHighlights}>
                  {latestAnalysis.priorityImprovements.slice(0, 2).map((improvement, index) => (
                    <View key={index} style={styles.highlightTag}>
                      <Text style={styles.highlightText} numberOfLines={1}>
                        {improvement}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyAnalysis}>
            <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Analyses Yet</Text>
            <Text style={styles.emptySubtitle}>
              Record your first video to get AI-powered feedback on your technique
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="fitness" size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Drills</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.info + '20' }]}>
                <Ionicons name="trending-up" size={24} color={colors.info} />
              </View>
              <Text style={styles.quickActionText}>Progress</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="time" size={24} color={colors.success} />
              </View>
              <Text style={styles.quickActionText}>History</Text>
            </Pressable>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Better Analysis</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color={colors.accent} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Good Lighting</Text>
              <Text style={styles.tipText}>
                Record in a well-lit area for the best analysis results
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="body" size={24} color={colors.accent} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Full Body Visible</Text>
              <Text style={styles.tipText}>
                Make sure your entire body is in frame during recording
              </Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  premiumBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
  analyzeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  analyzeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  analyzeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeText: {
    flex: 1,
  },
  analyzeTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  analyzeSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  analysisCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  analysisScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  analysisScore: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  analysisDate: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  analysisHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  highlightTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  highlightText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyAnalysis: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
