import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '@/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { Stance, ExperienceLevel } from '@/types';

interface OnboardingStep {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const steps: OnboardingStep[] = [
  {
    title: 'AI-Powered Analysis',
    subtitle: 'Get instant feedback on your boxing technique using advanced AI vision technology',
    icon: 'eye-outline',
  },
  {
    title: 'Track Your Progress',
    subtitle: 'See your improvement over time with detailed technique breakdowns and scoring',
    icon: 'trending-up-outline',
  },
  {
    title: 'Personalized Drills',
    subtitle: 'Receive custom drill recommendations based on areas that need improvement',
    icon: 'fitness-outline',
  },
];

export function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [stance, setStance] = useState<Stance>('orthodox');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);

  const isLastStep = currentStep === steps.length + 1; // +1 for setup step

  const handleNext = () => {
    if (currentStep < steps.length + 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[...Array(steps.length + 2)].map((_, index) => (
        <View key={index} style={[styles.dot, index === currentStep && styles.dotActive]} />
      ))}
    </View>
  );

  const renderStep = () => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      return (
        <View style={styles.stepContent}>
          <View style={styles.iconContainer}>
            <Ionicons name={step?.icon ?? 'help-outline'} size={80} color={colors.primary} />
          </View>
          <Text style={styles.title}>{step?.title}</Text>
          <Text style={styles.subtitle}>{step?.subtitle}</Text>
        </View>
      );
    }

    // Setup step
    if (currentStep === steps.length) {
      return (
        <View style={styles.stepContent}>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>Help us personalize your experience</Text>

          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Your Stance</Text>
            <View style={styles.optionRow}>
              <Pressable
                style={[styles.optionButton, stance === 'orthodox' && styles.optionButtonActive]}
                onPress={() => setStance('orthodox')}
              >
                <Text style={[styles.optionText, stance === 'orthodox' && styles.optionTextActive]}>
                  Orthodox
                </Text>
                <Text style={styles.optionHint}>Left foot forward</Text>
              </Pressable>
              <Pressable
                style={[styles.optionButton, stance === 'southpaw' && styles.optionButtonActive]}
                onPress={() => setStance('southpaw')}
              >
                <Text style={[styles.optionText, stance === 'southpaw' && styles.optionTextActive]}>
                  Southpaw
                </Text>
                <Text style={styles.optionHint}>Right foot forward</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Experience Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {(
                  ['beginner', 'intermediate', 'advanced', 'professional'] as ExperienceLevel[]
                ).map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.optionButton,
                      styles.optionButtonSmall,
                      experienceLevel === level && styles.optionButtonActive,
                    ]}
                    onPress={() => setExperienceLevel(level)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        experienceLevel === level && styles.optionTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      );
    }

    // Final step
    return (
      <View style={styles.stepContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Start analyzing your boxing technique and improve your skills today
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderStep()}
        {renderDots()}
      </View>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <Pressable style={styles.backButton} onPress={() => setCurrentStep(currentStep - 1)}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
          onPress={isLastStep ? handleComplete : handleNext}
        >
          <Text style={styles.nextButtonText}>{isLastStep ? 'Get Started' : 'Continue'}</Text>
          {!isLastStep && <Ionicons name="arrow-forward" size={20} color={colors.textPrimary} />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  optionGroup: {
    width: '100%',
    marginTop: spacing.xl,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSmall: {
    flex: 0,
    paddingHorizontal: spacing.lg,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  optionText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionTextActive: {
    color: colors.primary,
  },
  optionHint: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backButtonText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
