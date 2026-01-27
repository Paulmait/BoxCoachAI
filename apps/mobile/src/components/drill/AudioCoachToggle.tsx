// Audio Coach Toggle Component
import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';

interface AudioCoachToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  compact?: boolean;
}

export function AudioCoachToggle({ enabled, onToggle, compact = false }: AudioCoachToggleProps) {
  const handleToggle = () => {
    hapticLight();
    onToggle(!enabled);
  };

  if (compact) {
    return (
      <Pressable
        style={[styles.compactContainer, enabled && styles.compactContainerActive]}
        onPress={handleToggle}
      >
        <Ionicons
          name={enabled ? 'volume-high' : 'volume-mute'}
          size={20}
          color={enabled ? colors.primary : colors.textTertiary}
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="mic" size={20} color={enabled ? colors.primary : colors.textTertiary} />
        </View>
        <View>
          <Text style={styles.label}>Audio Coaching</Text>
          <Text style={styles.description}>
            {enabled ? 'Voice instructions enabled' : 'Voice instructions disabled'}
          </Text>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: colors.border, true: colors.primary + '50' }}
        thumbColor={enabled ? colors.primary : colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  compactContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContainerActive: {
    backgroundColor: colors.primary + '20',
  },
});
