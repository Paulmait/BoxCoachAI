import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '@/store/useAppStore';
import { authService } from '@/services/auth';
import { biometricsService } from '@/services/biometrics';
import { supabase } from '@/services/supabase';
import { APP_CONFIG } from '@/constants/config';
import { DELETE_DATA_CONFIRMATION } from '@/constants/legal';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import type { MainTabScreenProps } from '@/navigation/types';

type NavigationProp = MainTabScreenProps<'Settings'>['navigation'];

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAppStore((state) => state.user);
  const isPremium = useAppStore((state) => state.isPremium);
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t, locale, setLocale, languages } = useTranslation();

  const currentLanguage = languages.find(l => l.code === locale) || languages[0];

  const handleBiometricsToggle = async (enabled: boolean) => {
    if (enabled) {
      const isAvailable = await biometricsService.isAvailable();
      if (!isAvailable) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
        return;
      }

      const result = await biometricsService.authenticate();
      if (result.success) {
        // Store session refresh token for biometric login
        const refreshToken = await authService.getCurrentRefreshToken();
        if (refreshToken && user?.email) {
          await biometricsService.storeSession(refreshToken, user.email);
          updatePreferences({ biometricsEnabled: true });
        } else {
          Alert.alert('Error', 'Could not save session for biometric login.');
        }
      } else {
        Alert.alert('Authentication Failed', 'Could not enable biometrics.');
      }
    } else {
      await biometricsService.clearSession();
      updatePreferences({ biometricsEnabled: false });
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authService.signOut();
        },
      },
    ]);
  };

  const handleDeleteData = () => {
    Alert.alert(
      DELETE_DATA_CONFIRMATION.title,
      DELETE_DATA_CONFIRMATION.message,
      [
        { text: DELETE_DATA_CONFIRMATION.cancelButton, style: 'cancel' },
        {
          text: DELETE_DATA_CONFIRMATION.confirmButton,
          style: 'destructive',
          onPress: async () => {
            setIsDeletingData(true);
            try {
              // Call the delete-user-data edge function
              const { data, error } = await supabase.functions.invoke('delete-user-data', {
                body: { confirmDelete: true },
              });

              if (error) {
                throw new Error(error.message);
              }

              if (data?.success) {
                // Clear local session and biometric data
                await biometricsService.clearSession();
                await authService.signOut();
                Alert.alert(
                  'Data Deleted',
                  'Your account and all associated data have been permanently deleted.'
                );
              } else {
                throw new Error(data?.error || 'Deletion failed');
              }
            } catch (error) {
              console.error('Delete data error:', error);
              Alert.alert(
                'Deletion Failed',
                `We couldn't complete your request. Please contact ${APP_CONFIG.privacyEmail} for manual deletion.`
              );
            } finally {
              setIsDeletingData(false);
            }
          },
        },
      ]
    );
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Could not open email client');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileEmail}>{user?.email || 'Not signed in'}</Text>
                <Text style={styles.profileStance}>
                  {user?.profile?.stance || 'Orthodox'} • {user?.profile?.experienceLevel || 'Beginner'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Home', {
              screen: 'Paywall',
              params: { source: 'settings' },
            } as any)}
          >
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name={isPremium ? 'star' : 'star-outline'}
                  size={24}
                  color={isPremium ? colors.accent : colors.textTertiary}
                />
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>
                    {isPremium ? 'Premium Member' : 'Free Plan'}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {isPremium
                      ? 'Unlimited analyses'
                      : '3 analyses per day'}
                  </Text>
                </View>
              </View>
              {!isPremium && (
                <View style={styles.upgradeBadge}>
                  <Text style={styles.upgradeBadgeText}>Upgrade</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="finger-print" size={24} color={colors.textTertiary} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Face ID / Touch ID</Text>
                  <Text style={styles.rowSubtitle}>Use biometrics to sign in</Text>
                </View>
              </View>
              <Switch
                value={preferences.biometricsEnabled}
                onValueChange={handleBiometricsToggle}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={preferences.biometricsEnabled ? colors.primary : colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="notifications" size={24} color={colors.textTertiary} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{t('settings.notifications')}</Text>
                  <Text style={styles.rowSubtitle}>Drill reminders & tips</Text>
                </View>
              </View>
              <Switch
                value={preferences.notificationsEnabled}
                onValueChange={(enabled) => updatePreferences({ notificationsEnabled: enabled })}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={preferences.notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            </View>

            <View style={styles.divider} />

            <Pressable style={styles.row} onPress={() => setShowLanguageModal(true)}>
              <View style={styles.rowLeft}>
                <Ionicons name="language" size={24} color={colors.textTertiary} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{t('settings.language')}</Text>
                  <Text style={styles.rowSubtitle}>{currentLanguage.nativeName}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <Pressable
              style={styles.row}
              onPress={() => openUrl(APP_CONFIG.urls.privacy)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="shield-checkmark" size={24} color={colors.textTertiary} />
                <Text style={styles.rowTitle}>Privacy Policy</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.row}
              onPress={() => openUrl(APP_CONFIG.urls.terms)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="document-text" size={24} color={colors.textTertiary} />
                <Text style={styles.rowTitle}>Terms of Service</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.row}
              onPress={() => openUrl(APP_CONFIG.urls.eula)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="reader" size={24} color={colors.textTertiary} />
                <Text style={styles.rowTitle}>End User License Agreement</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.row}
              onPress={() => openUrl('https://anthropic.com/privacy')}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="information-circle" size={24} color={colors.textTertiary} />
                <Text style={styles.rowTitle}>AI Provider Privacy (Anthropic)</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <Pressable
              style={styles.row}
              onPress={() => openEmail(APP_CONFIG.supportEmail)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name="mail" size={24} color={colors.textTertiary} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Contact Support</Text>
                  <Text style={styles.rowSubtitle}>{APP_CONFIG.supportEmail}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Pressable style={styles.row} onPress={handleSignOut}>
              <View style={styles.rowLeft}>
                <Ionicons name="log-out" size={24} color={colors.warning} />
                <Text style={[styles.rowTitle, { color: colors.warning }]}>Sign Out</Text>
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.row} onPress={handleDeleteData} disabled={isDeletingData}>
              <View style={styles.rowLeft}>
                <Ionicons name="trash" size={24} color={colors.error} />
                <Text style={[styles.rowTitle, { color: colors.error }]}>Delete My Data</Text>
              </View>
              {isDeletingData && <ActivityIndicator size="small" color={colors.error} />}
            </Pressable>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{APP_CONFIG.company}</Text>
          <Text style={styles.companyLocation}>{APP_CONFIG.companyLocation}</Text>
          <Text style={styles.version}>{APP_CONFIG.name} v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLanguageModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
              <Pressable onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={styles.languageList}>
              {languages.map((language) => (
                <Pressable
                  key={language.code}
                  style={styles.languageItem}
                  onPress={async () => {
                    await setLocale(language.code);
                    setShowLanguageModal(false);
                  }}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageNative}>{language.nativeName}</Text>
                    <Text style={styles.languageName}>{language.name}</Text>
                  </View>
                  {locale === language.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileEmail: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  profileStance: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowContent: {
    marginLeft: spacing.md,
  },
  rowTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  rowSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  upgradeBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  upgradeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.background,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 24 + spacing.md,
  },
  companyInfo: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  companyName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  companyLocation: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  languageList: {
    paddingHorizontal: spacing.lg,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageInfo: {
    flex: 1,
  },
  languageNative: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  languageName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
