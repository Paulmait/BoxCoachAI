// XP Gain Toast Component
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import type { XPGain } from '@/types/gamification';

interface XPGainToastProps {
  xpGain: XPGain | null;
  visible: boolean;
  onHide: () => void;
}

export function XPGainToast({ xpGain, visible, onHide }: XPGainToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !xpGain) {
      return;
    }

    // Show animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 2 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [visible, xpGain, translateY, opacity, onHide]);

  if (!visible || !xpGain) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="star" size={20} color={colors.accent} />
      </View>
      <View style={styles.content}>
        <Text style={styles.xpText}>+{xpGain.amount} XP</Text>
        <Text style={styles.reasonText}>{xpGain.reason}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  xpText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
