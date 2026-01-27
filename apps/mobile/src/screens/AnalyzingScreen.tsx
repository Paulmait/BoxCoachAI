import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { analysisService } from '@/services/analysis';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing, fontSize } from '@/constants/theme';
import type { HomeStackScreenProps } from '@/navigation/types';

type NavigationProp = HomeStackScreenProps<'Analyzing'>['navigation'];
type RouteProp = HomeStackScreenProps<'Analyzing'>['route'];

const ANALYSIS_STEPS = [
  { label: 'Uploading video...', duration: 2000 },
  { label: 'Extracting key frames...', duration: 1500 },
  { label: 'Analyzing stance...', duration: 2000 },
  { label: 'Evaluating technique...', duration: 2500 },
  { label: 'Identifying improvements...', duration: 2000 },
  { label: 'Generating recommendations...', duration: 1500 },
];

export function AnalyzingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { videoUri, boxerSelectionId } = route.params;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress] = useState(new Animated.Value(0));

  const user = useAppStore((state) => state.user);
  const incrementAnalysesUsed = useAppStore((state) => state.incrementAnalysesUsed);
  const setCurrentAnalysis = useAppStore((state) => state.setCurrentAnalysis);
  const addAnalysisToHistory = useAppStore((state) => state.addAnalysisToHistory);

  useEffect(() => {
    startAnalysis();
  }, []);

  const startAnalysis = async () => {
    // Start step animation
    animateSteps();

    try {
      const result = await analysisService.analyzeVideo({
        videoUri,
        boxerSelection: boxerSelectionId
          ? {
              personId: boxerSelectionId,
              boundingBox: { x: 0, y: 0, width: 100, height: 100 },
              frameIndex: 0,
              timestamp: Date.now(),
            }
          : undefined,
        userStance: user?.profile?.stance || 'orthodox',
        experienceLevel: user?.profile?.experienceLevel || 'beginner',
      });

      if (result.success && result.analysis) {
        incrementAnalysesUsed();
        setCurrentAnalysis(result.analysis);
        addAnalysisToHistory(result.analysis);

        // Navigate to results
        navigation.replace('Results', { analysisId: result.analysis.id });
      } else {
        Alert.alert('Analysis Failed', result.error || 'Please try again.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const animateSteps = () => {
    let stepIndex = 0;

    const advanceStep = () => {
      if (stepIndex < ANALYSIS_STEPS.length - 1) {
        stepIndex++;
        setCurrentStepIndex(stepIndex);

        const step = ANALYSIS_STEPS[stepIndex];
        if (step) {
          setTimeout(advanceStep, step.duration);
        }
      }
    };

    const firstStep = ANALYSIS_STEPS[0];
    if (firstStep) {
      setTimeout(advanceStep, firstStep.duration);
    }

    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: ANALYSIS_STEPS.reduce((acc, step) => acc + step.duration, 0),
      useNativeDriver: false,
    }).start();
  };

  const currentStep = ANALYSIS_STEPS[currentStepIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <View style={styles.pulseOuter}>
            <View style={styles.pulseInner}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Analyzing Your Technique</Text>
        <Text style={styles.stepLabel}>{currentStep?.label}</Text>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.stepsContainer}>
          {ANALYSIS_STEPS.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  index <= currentStepIndex && styles.stepDotActive,
                  index < currentStepIndex && styles.stepDotComplete,
                ]}
              />
              <Text
                style={[
                  styles.stepText,
                  index <= currentStepIndex && styles.stepTextActive,
                ]}
              >
                {step.label.replace('...', '')}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.hint}>
          This usually takes about 15-30 seconds
        </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  animationContainer: {
    marginBottom: spacing.xl,
  },
  pulseOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepLabel: {
    fontSize: fontSize.md,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  stepsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotComplete: {
    backgroundColor: colors.success,
  },
  stepText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  stepTextActive: {
    color: colors.textSecondary,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },
});
