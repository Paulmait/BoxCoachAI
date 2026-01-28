import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { authService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { SuspensionInfo } from '@/types';

interface SuspendedScreenProps {
  suspensionInfo?: SuspensionInfo;
}

export function SuspendedScreen({ suspensionInfo }: SuspendedScreenProps) {
  const user = useAppStore((state) => state.user);
  const suspension = suspensionInfo || user?.suspension;

  const isPaused = suspension?.pausedUntil != null;
  const pausedUntilDate = suspension?.pausedUntil ? new Date(suspension.pausedUntil) : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = () => {
    if (!pausedUntilDate) return '';
    const now = new Date();
    const diff = pausedUntilDate.getTime() - now.getTime();
    if (diff <= 0) return 'Pause expired - please restart the app';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const handleContactSupport = () => {
    // Could open email or support link
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={isPaused ? 'pause-circle' : 'ban'}
            size={80}
            color={isPaused ? colors.warning : colors.error}
          />
        </View>

        <Text style={styles.title}>{isPaused ? 'Account Paused' : 'Account Suspended'}</Text>

        <Text style={styles.subtitle}>
          {isPaused
            ? 'Your account has been temporarily paused.'
            : 'Your account has been suspended.'}
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Reason</Text>
          <Text style={styles.infoValue}>
            {suspension?.reason || 'Violation of community guidelines'}
          </Text>
        </View>

        {suspension?.suspendedAt && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{isPaused ? 'Paused On' : 'Suspended On'}</Text>
            <Text style={styles.infoValue}>{formatDate(suspension.suspendedAt)}</Text>
          </View>
        )}

        {isPaused && pausedUntilDate && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Access Restored On</Text>
              <Text style={styles.infoValue}>{formatDate(suspension?.pausedUntil)}</Text>
            </View>

            <View style={[styles.infoCard, styles.highlightCard]}>
              <Ionicons name="time-outline" size={24} color={colors.warning} />
              <Text style={styles.timeRemaining}>{getTimeRemaining()}</Text>
            </View>
          </>
        )}

        <View style={styles.messageCard}>
          <Ionicons name="information-circle" size={24} color={colors.textSecondary} />
          <Text style={styles.messageText}>
            {isPaused
              ? 'Your account will be automatically restored when the pause period ends. You can close this app and return later.'
              : 'If you believe this suspension was made in error, please contact our support team for assistance.'}
          </Text>
        </View>

        <View style={styles.actions}>
          {!isPaused && (
            <Pressable style={styles.supportButton} onPress={handleContactSupport}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </Pressable>
          )}

          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={styles.email}>{user?.email}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: `${colors.warning}15`,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  timeRemaining: {
    fontSize: fontSize.md,
    color: colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  messageCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  messageText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  supportButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  signOutButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  email: {
    marginTop: spacing.xl,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
