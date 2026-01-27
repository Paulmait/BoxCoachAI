// Haptic Feedback Utility
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

let hapticEnabled = true;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticEnabled = enabled;
};

export const isHapticsEnabled = () => hapticEnabled;

export const triggerHaptic = async (type: HapticType = 'light') => {
  if (!hapticEnabled || Platform.OS === 'web') return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic feedback failed:', error);
  }
};

// Convenience functions
export const hapticLight = () => triggerHaptic('light');
export const hapticMedium = () => triggerHaptic('medium');
export const hapticHeavy = () => triggerHaptic('heavy');
export const hapticSuccess = () => triggerHaptic('success');
export const hapticWarning = () => triggerHaptic('warning');
export const hapticError = () => triggerHaptic('error');
export const hapticSelection = () => triggerHaptic('selection');

// Timer-specific patterns
export const hapticRoundStart = async () => {
  await triggerHaptic('heavy');
};

export const hapticRoundEnd = async () => {
  await triggerHaptic('success');
};

export const hapticWarningAlert = async () => {
  await triggerHaptic('warning');
};

// Achievement unlock pattern
export const hapticAchievementUnlock = async () => {
  await triggerHaptic('success');
  // Double tap for celebration
  setTimeout(() => triggerHaptic('medium'), 150);
};

// Button press feedback
export const hapticButtonPress = () => triggerHaptic('light');
