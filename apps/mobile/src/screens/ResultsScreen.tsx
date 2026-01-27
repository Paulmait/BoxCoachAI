import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '@/store/useAppStore';
import { ScoreRing } from '@/components/ScoreRing';
import { TechniqueCard } from '@/components/TechniqueCard';
import { RootCauseCard } from '@/components/RootCauseCard';
import { DrillRecommendationCard } from '@/components/DrillRecommendationCard';
import { drillLibrary } from '@/data/drillLibrary';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { HomeStackScreenProps } from '@/navigation/types';

type NavigationProp = HomeStackScreenProps<'Results'>['navigation'];
type RouteProp = HomeStackScreenProps<'Results'>['route'];

export function ResultsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { analysisId } = route.params;

  const analysis = useAppStore((state) =>
    state.analysisHistory.find((a) => a.id === analysisId) || state.currentAnalysis
  );

  if (!analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Analysis not found</Text>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.scoreExcellent;
    if (score >= 60) return colors.scoreGood;
    if (score >= 40) return colors.scoreAverage;
    return colors.scoreNeedsWork;
  };

  const recommendedDrills = analysis.recommendedDrills
    .map((id) => drillLibrary.find((d) => d.id === id))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => navigation.popToTop()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <Pressable style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Score */}
        <View style={styles.scoreSection}>
          <ScoreRing score={analysis.overallScore} size={140} strokeWidth={12} />
          <Text style={styles.scoreLabel}>Overall Score</Text>
          <Text style={[styles.scoreDescription, { color: getScoreColor(analysis.overallScore) }]}>
            {analysis.overallScore >= 80
              ? 'Excellent Technique!'
              : analysis.overallScore >= 60
                ? 'Good Progress!'
                : analysis.overallScore >= 40
                  ? 'Keep Practicing!'
                  : 'Needs Improvement'}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>
        </View>

        {/* Strengths */}
        {analysis.topStrengths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            <View style={styles.listCard}>
              {analysis.topStrengths.map((strength, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.listItemText}>{strength}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Areas to Improve */}
        {analysis.priorityImprovements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas to Improve</Text>
            <View style={styles.listCard}>
              {analysis.priorityImprovements.map((improvement, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="arrow-up-circle" size={20} color={colors.warning} />
                  <Text style={styles.listItemText}>{improvement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Technique Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technique Breakdown</Text>
          {analysis.techniqueScores.map((technique, index) => (
            <TechniqueCard key={index} technique={technique} />
          ))}
        </View>

        {/* Root Causes */}
        {analysis.rootCauses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Root Causes</Text>
            {analysis.rootCauses.map((rootCause, index) => (
              <RootCauseCard key={index} rootCause={rootCause} />
            ))}
          </View>
        )}

        {/* Recommended Drills */}
        {recommendedDrills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Drills</Text>
              <Pressable onPress={() => navigation.navigate('Home', {
                screen: 'HomeMain',
              })}>
                <Text style={styles.sectionLink}>View All</Text>
              </Pressable>
            </View>
            {recommendedDrills.map((drill) => drill && (
              <DrillRecommendationCard
                key={drill.id}
                drill={drill}
                onPress={() => {}}
              />
            ))}
          </View>
        )}

        {/* Analyze Again CTA */}
        <View style={styles.ctaSection}>
          <Pressable
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Record')}
          >
            <Ionicons name="videocam" size={24} color={colors.textPrimary} />
            <Text style={styles.ctaButtonText}>Analyze Another Video</Text>
          </Pressable>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  scoreLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  scoreDescription: {
    fontSize: fontSize.md,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  listItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  ctaSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  ctaButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
