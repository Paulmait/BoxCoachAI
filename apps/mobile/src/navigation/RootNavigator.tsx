import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppStore } from '@/store/useAppStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { SuspendedScreen } from '@/screens/auth/SuspendedScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors } from '@/constants/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const user = useAppStore((state) => state.user);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  // Check if user is suspended
  const isSuspended = user?.suspension?.isSuspended === true;

  return (
    <ErrorBoundary>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isSuspended ? (
          <Stack.Screen name="Suspended" component={SuspendedScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
