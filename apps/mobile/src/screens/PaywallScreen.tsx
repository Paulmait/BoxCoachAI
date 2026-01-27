import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { subscriptionService } from '@/services/subscriptions';
import { useAppStore } from '@/store/useAppStore';
import { SUBSCRIPTION_CONFIG } from '@/constants/config';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { HomeStackScreenProps } from '@/navigation/types';

type NavigationProp = HomeStackScreenProps<'Paywall'>['navigation'];
type RouteProp = HomeStackScreenProps<'Paywall'>['route'];

const FEATURES = {
  basic: [
    { icon: 'infinite', title: 'Unlimited Analyses', description: 'No daily limits' },
    { icon: 'trending-up', title: 'Progress Tracking', description: 'Track improvements over time' },
    { icon: 'fitness', title: 'Full Drill Library', description: 'Access all drills' },
    { icon: 'time', title: 'Analysis History', description: 'Review past sessions' },
  ],
  pro: [
    { icon: 'infinite', title: 'Everything in Basic', description: 'Plus advanced features' },
    { icon: 'flash', title: 'Priority Processing', description: 'Faster analysis times' },
    { icon: 'sparkles', title: 'Advanced Insights', description: 'Deeper technique analysis' },
    { icon: 'videocam', title: 'Longer Videos', description: 'Up to 2 minute videos' },
    { icon: 'analytics', title: 'Detailed Reports', description: 'Exportable progress reports' },
  ],
};

type PlanType = 'basic' | 'pro';
type BillingPeriod = 'monthly' | 'annual';

export function PaywallScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const source = route.params?.source || 'settings';

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const setIsPremium = useAppStore((state) => state.setIsPremium);

  const getPrice = (plan: PlanType, period: BillingPeriod): string => {
    const config = SUBSCRIPTION_CONFIG.products;
    if (plan === 'basic') {
      return period === 'monthly' ? config.basicMonthly.priceString : config.basicAnnual.priceString;
    }
    return period === 'monthly' ? config.proMonthly.priceString : config.proAnnual.priceString;
  };

  const getSavings = (plan: PlanType): string | undefined => {
    const config = SUBSCRIPTION_CONFIG.products;
    return plan === 'basic' ? config.basicAnnual.savings : config.proAnnual.savings;
  };

  const getPackageIdentifier = (): string => {
    const config = SUBSCRIPTION_CONFIG.products;
    if (selectedPlan === 'basic') {
      return selectedPeriod === 'monthly'
        ? config.basicMonthly.identifier
        : config.basicAnnual.identifier;
    }
    return selectedPeriod === 'monthly'
      ? config.proMonthly.identifier
      : config.proAnnual.identifier;
  };

  const handlePurchase = async () => {
    const identifier = getPackageIdentifier();

    setIsPurchasing(true);
    try {
      const success = await subscriptionService.purchase(identifier);
      if (success) {
        setIsPremium(true);
        Alert.alert(
          'Welcome to Premium!',
          'You now have unlimited access to all features.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Please try again later.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const restored = await subscriptionService.restore();
      if (restored) {
        setIsPremium(true);
        Alert.alert('Restored!', 'Your subscription has been restored.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find any previous purchases.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Please try again later.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getHeaderText = () => {
    switch (source) {
      case 'limit_reached':
        return 'You\'ve reached your daily limit';
      case 'feature_locked':
        return 'Unlock this feature';
      default:
        return 'Choose Your Plan';
    }
  };

  const features = selectedPlan === 'pro' ? FEATURES.pro : FEATURES.basic;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={48} color={colors.accent} />
          </View>
          <Text style={styles.title}>{getHeaderText()}</Text>
          <Text style={styles.subtitle}>
            Unlock your full boxing potential with AI coaching
          </Text>
        </View>

        {/* Trial Badge */}
        <View style={styles.trialBadge}>
          <Ionicons name="gift" size={20} color={colors.success} />
          <Text style={styles.trialText}>
            Start with a {SUBSCRIPTION_CONFIG.trialDays}-day free trial
          </Text>
        </View>

        {/* Plan Toggle */}
        <View style={styles.planToggle}>
          <Pressable
            style={[styles.planButton, selectedPlan === 'basic' && styles.planButtonActive]}
            onPress={() => setSelectedPlan('basic')}
          >
            <Text style={[styles.planButtonText, selectedPlan === 'basic' && styles.planButtonTextActive]}>
              Basic
            </Text>
          </Pressable>
          <Pressable
            style={[styles.planButton, selectedPlan === 'pro' && styles.planButtonActive]}
            onPress={() => setSelectedPlan('pro')}
          >
            <Text style={[styles.planButtonText, selectedPlan === 'pro' && styles.planButtonTextActive]}>
              Pro
            </Text>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          </Pressable>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Billing Period */}
        <View style={styles.periodContainer}>
          <Pressable
            style={[styles.periodCard, selectedPeriod === 'annual' && styles.periodCardActive]}
            onPress={() => setSelectedPeriod('annual')}
          >
            {selectedPeriod === 'annual' && (
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
            )}
            <View style={styles.periodHeader}>
              <View style={[styles.radioOuter, selectedPeriod === 'annual' && styles.radioOuterActive]}>
                {selectedPeriod === 'annual' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.periodTitle}>Annual</Text>
            </View>
            <Text style={styles.periodPrice}>{getPrice(selectedPlan, 'annual')}</Text>
            <Text style={styles.periodDetail}>per year</Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save {getSavings(selectedPlan)}</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.periodCard, selectedPeriod === 'monthly' && styles.periodCardActive]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <View style={styles.periodHeader}>
              <View style={[styles.radioOuter, selectedPeriod === 'monthly' && styles.radioOuterActive]}>
                {selectedPeriod === 'monthly' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.periodTitle}>Monthly</Text>
            </View>
            <Text style={styles.periodPrice}>{getPrice(selectedPlan, 'monthly')}</Text>
            <Text style={styles.periodDetail}>per month</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Start {SUBSCRIPTION_CONFIG.trialDays}-Day Free Trial
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Cancel anytime. After free trial, {selectedPeriod === 'annual' ? 'annual' : 'monthly'} subscription auto-renews at {getPrice(selectedPlan, selectedPeriod)}/{selectedPeriod === 'annual' ? 'year' : 'month'} unless cancelled at least 24 hours before the end of the current period.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  closeButton: {
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
    paddingBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  trialText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
  },
  planToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  planButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  planButtonActive: {
    backgroundColor: colors.primary,
  },
  planButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  planButtonTextActive: {
    color: colors.textPrimary,
  },
  popularBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  popularText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.background,
  },
  featuresContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  featureTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  featureDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  periodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  periodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -40,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  bestValueText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.background,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  periodTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  periodPrice: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  periodDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  savingsBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.success,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  restoreButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
