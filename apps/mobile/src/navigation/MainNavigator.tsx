import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';

import { HomeScreen } from '@/screens/HomeScreen';
import { AnalyzingScreen } from '@/screens/AnalyzingScreen';
import { ResultsScreen } from '@/screens/ResultsScreen';
import { RecordScreen } from '@/screens/RecordScreen';
import { BoxerSelectionScreen } from '@/screens/BoxerSelectionScreen';
import { DrillLibraryScreen } from '@/screens/DrillLibraryScreen';
import { DrillDetailScreen } from '@/screens/DrillDetailScreen';
import { ProgressScreen } from '@/screens/ProgressScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { PaywallScreen } from '@/screens/PaywallScreen';
import { TimerScreen } from '@/screens/TimerScreen';
import { AchievementsScreen } from '@/screens/AchievementsScreen';
import { TrainingPlansScreen } from '@/screens/TrainingPlansScreen';
import { ActivePlanScreen } from '@/screens/ActivePlanScreen';
import { ComboRandomizerScreen } from '@/screens/ComboRandomizerScreen';
import { JournalScreen } from '@/screens/JournalScreen';
import { CompareScreen } from '@/screens/CompareScreen';
import { colors, spacing } from '@/constants/theme';
import { TabBarIcon } from '@/components/TabBarIcon';
import type {
  MainTabParamList,
  HomeStackParamList,
  DrillStackParamList,
  ProgressStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DrillStack = createNativeStackNavigator<DrillStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Record" component={RecordScreen} />
      <HomeStack.Screen name="BoxerSelection" component={BoxerSelectionScreen} />
      <HomeStack.Screen name="Analyzing" component={AnalyzingScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
      <HomeStack.Screen name="Paywall" component={PaywallScreen} />
      <HomeStack.Screen name="Timer" component={TimerScreen} />
      <HomeStack.Screen name="Achievements" component={AchievementsScreen} />
      <HomeStack.Screen name="TrainingPlans" component={TrainingPlansScreen} />
      <HomeStack.Screen name="ActivePlan" component={ActivePlanScreen} />
      <HomeStack.Screen name="ComboRandomizer" component={ComboRandomizerScreen} />
      <HomeStack.Screen name="Journal" component={JournalScreen} />
    </HomeStack.Navigator>
  );
}

function DrillStackNavigator() {
  return (
    <DrillStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <DrillStack.Screen name="DrillLibrary" component={DrillLibraryScreen} />
      <DrillStack.Screen name="DrillDetail" component={DrillDetailScreen} />
    </DrillStack.Navigator>
  );
}

function ProgressStackNavigator() {
  return (
    <ProgressStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ProgressStack.Screen name="ProgressMain" component={ProgressScreen} />
      <ProgressStack.Screen name="Compare" component={CompareScreen} />
    </ProgressStack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Drills"
        component={DrillStackNavigator}
        options={{
          tabBarLabel: 'Drills',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'fitness' : 'fitness-outline'} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analyze"
        component={RecordScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.analyzeButton}>
              <TabBarIcon name="videocam" color={colors.textPrimary} size={28} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressStackNavigator}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 85,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabBarItem: {
    paddingTop: spacing.xs,
  },
  analyzeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
