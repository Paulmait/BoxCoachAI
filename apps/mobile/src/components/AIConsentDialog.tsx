import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { APP_CONFIG } from '@/constants/config';
import { AI_DISCLOSURE } from '@/constants/legal';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

interface AIConsentDialogProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentDialog({ visible, onAccept, onDecline }: AIConsentDialogProps) {
  const openPrivacyPolicy = () => {
    Linking.openURL(APP_CONFIG.urls.privacy);
  };

  const openAnthropicPrivacy = () => {
    Linking.openURL('https://anthropic.com/privacy');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={32} color={colors.primary} />
          </View>

          <Text style={styles.title}>AI-Powered Analysis</Text>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>{AI_DISCLOSURE}</Text>

            <View style={styles.bulletPoints}>
              <View style={styles.bulletItem}>
                <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                <Text style={styles.bulletText}>
                  Video frames are encrypted during transmission
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="eye-off" size={18} color={colors.success} />
                <Text style={styles.bulletText}>
                  Anthropic does not store or train on your data
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="lock-closed" size={18} color={colors.success} />
                <Text style={styles.bulletText}>
                  Analysis results are stored only in your account
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="trash" size={18} color={colors.success} />
                <Text style={styles.bulletText}>
                  You can delete your data at any time in Settings
                </Text>
              </View>
            </View>

            <View style={styles.links}>
              <Pressable style={styles.linkButton} onPress={openPrivacyPolicy}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <Text style={styles.linkText}>View Privacy Policy</Text>
              </Pressable>

              <Pressable style={styles.linkButton} onPress={openAnthropicPrivacy}>
                <Ionicons name="open-outline" size={16} color={colors.primary} />
                <Text style={styles.linkText}>Anthropic Privacy Policy</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </Pressable>
            <Pressable style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptButtonText}>I Understand & Agree</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contentScroll: {
    maxHeight: 350,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bulletPoints: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  declineButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
