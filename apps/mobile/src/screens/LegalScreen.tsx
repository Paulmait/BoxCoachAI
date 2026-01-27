import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { PRIVACY_POLICY, TERMS_OF_SERVICE, EULA } from '@/constants/legal';
import { colors, spacing, fontSize } from '@/constants/theme';

type LegalType = 'privacy' | 'terms' | 'eula';

type LegalRouteParams = {
  Legal: {
    type: LegalType;
  };
};

const LEGAL_CONTENT: Record<LegalType, { title: string; content: string }> = {
  privacy: { title: 'Privacy Policy', content: PRIVACY_POLICY },
  terms: { title: 'Terms of Service', content: TERMS_OF_SERVICE },
  eula: { title: 'EULA', content: EULA },
};

export function LegalScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<LegalRouteParams, 'Legal'>>();
  const type = route.params?.type || 'privacy';

  const { title, content } = LEGAL_CONTENT[type];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.content}>{content}</Text>
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
  backButton: {
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
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
