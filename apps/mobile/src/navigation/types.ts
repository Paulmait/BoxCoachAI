import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root Stack
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Drills: NavigatorScreenParams<DrillStackParamList>;
  Analyze: undefined;
  Progress: NavigatorScreenParams<ProgressStackParamList>;
  Settings: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeMain: undefined;
  Record: undefined;
  BoxerSelection: {
    videoUri: string;
    frameUri: string;
  };
  Analyzing: {
    videoUri: string;
    boxerSelectionId?: string;
  };
  Results: {
    analysisId: string;
  };
  Paywall: {
    source?: 'limit_reached' | 'feature_locked' | 'settings';
  };
  Timer: undefined;
  Achievements: undefined;
  TrainingPlans: undefined;
  ActivePlan: undefined;
  PlanDetail: {
    planId: string;
  };
  ComboRandomizer: undefined;
  Journal: undefined;
};

// Drill Stack
export type DrillStackParamList = {
  DrillLibrary: {
    recommendedDrillIds?: string[];
    rootCause?: string;
  } | undefined;
  DrillDetail: {
    drillId: string;
  };
};

// Progress Stack
export type ProgressStackParamList = {
  ProgressMain: undefined;
  Compare: {
    analysisId1: string;
    analysisId2: string;
  };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  MainTabScreenProps<'Home'>
>;

export type DrillStackScreenProps<T extends keyof DrillStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DrillStackParamList, T>,
  MainTabScreenProps<'Drills'>
>;

export type ProgressStackScreenProps<T extends keyof ProgressStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProgressStackParamList, T>,
  MainTabScreenProps<'Progress'>
>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
