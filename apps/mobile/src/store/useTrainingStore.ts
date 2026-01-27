// Training Plan Store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivePlan, CompletedDay, PlanProgress, TodayTraining } from '@/types/trainingPlan';
import { TRAINING_PLANS } from '@/data/trainingPlans';

interface TrainingStore {
  activePlan: ActivePlan | null;
  completedPlans: string[];

  // Actions
  startPlan: (planId: string) => void;
  completeDay: (drillsCompleted: string[], duration?: number) => void;
  skipDay: () => void;
  cancelPlan: () => void;
  getPlanProgress: () => PlanProgress | null;
  getTodayTraining: () => TodayTraining | null;
  isCurrentDayCompleted: () => boolean;
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set, get) => ({
      activePlan: null,
      completedPlans: [],

      startPlan: (planId) => {
        const plan = TRAINING_PLANS.find((p) => p.id === planId);
        if (!plan) return;

        set({
          activePlan: {
            planId,
            startDate: new Date().toISOString().split('T')[0],
            currentWeek: 1,
            currentDay: 1,
            completedDays: [],
          },
        });
      },

      completeDay: (drillsCompleted, duration) => {
        set((state) => {
          if (!state.activePlan) return state;

          const plan = TRAINING_PLANS.find((p) => p.id === state.activePlan!.planId);
          if (!plan) return state;

          const today = new Date().toISOString().split('T')[0];
          const completedDay: CompletedDay = {
            date: today,
            weekNumber: state.activePlan.currentWeek,
            dayNumber: state.activePlan.currentDay,
            drillsCompleted,
            duration,
          };

          // Calculate next day
          const currentWeek = plan.weeks[state.activePlan.currentWeek - 1];
          const isLastDayOfWeek = state.activePlan.currentDay >= currentWeek.days.length;
          const isLastWeek = state.activePlan.currentWeek >= plan.weeks.length;

          let newWeek = state.activePlan.currentWeek;
          let newDay = state.activePlan.currentDay + 1;

          if (isLastDayOfWeek) {
            if (isLastWeek) {
              // Plan complete
              return {
                activePlan: null,
                completedPlans: [...state.completedPlans, state.activePlan.planId],
              };
            }
            // Move to next week
            newWeek += 1;
            newDay = 1;
          }

          return {
            activePlan: {
              ...state.activePlan,
              currentWeek: newWeek,
              currentDay: newDay,
              completedDays: [...state.activePlan.completedDays, completedDay],
            },
          };
        });
      },

      skipDay: () => {
        set((state) => {
          if (!state.activePlan) return state;

          const plan = TRAINING_PLANS.find((p) => p.id === state.activePlan!.planId);
          if (!plan) return state;

          const currentWeek = plan.weeks[state.activePlan.currentWeek - 1];
          const isLastDayOfWeek = state.activePlan.currentDay >= currentWeek.days.length;
          const isLastWeek = state.activePlan.currentWeek >= plan.weeks.length;

          let newWeek = state.activePlan.currentWeek;
          let newDay = state.activePlan.currentDay + 1;

          if (isLastDayOfWeek) {
            if (isLastWeek) {
              return state; // Can't skip last day
            }
            newWeek += 1;
            newDay = 1;
          }

          return {
            activePlan: {
              ...state.activePlan,
              currentWeek: newWeek,
              currentDay: newDay,
            },
          };
        });
      },

      cancelPlan: () => {
        set({ activePlan: null });
      },

      getPlanProgress: () => {
        const state = get();
        if (!state.activePlan) return null;

        const plan = TRAINING_PLANS.find((p) => p.id === state.activePlan!.planId);
        if (!plan) return null;

        const totalDays = plan.weeks.reduce((sum, week) => sum + week.days.length, 0);
        const completedDays = state.activePlan.completedDays.length;

        // Calculate current streak
        let currentStreak = 0;
        const sortedCompleted = [...state.activePlan.completedDays].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const today = new Date();
        for (const day of sortedCompleted) {
          const dayDate = new Date(day.date);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - currentStreak);

          if (dayDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
            currentStreak++;
          } else {
            break;
          }
        }

        // Calculate missed days (days between start and now minus completed)
        const startDate = new Date(state.activePlan.startDate);
        const daysSinceStart = Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const missedDays = Math.max(0, daysSinceStart - completedDays);

        return {
          planId: state.activePlan.planId,
          totalDays,
          completedDays,
          percentComplete: Math.round((completedDays / totalDays) * 100),
          currentStreak,
          missedDays,
        };
      },

      getTodayTraining: () => {
        const state = get();
        if (!state.activePlan) return null;

        const plan = TRAINING_PLANS.find((p) => p.id === state.activePlan!.planId);
        if (!plan) return null;

        const currentWeek = plan.weeks[state.activePlan.currentWeek - 1];
        if (!currentWeek) return null;

        const currentDay = currentWeek.days[state.activePlan.currentDay - 1];
        if (!currentDay) return null;

        const today = new Date().toISOString().split('T')[0];
        const isCompleted = state.activePlan.completedDays.some((d) => d.date === today);

        return {
          planId: plan.id,
          planName: plan.name,
          weekNumber: state.activePlan.currentWeek,
          dayNumber: state.activePlan.currentDay,
          dayName: currentDay.name,
          isRestDay: currentDay.isRestDay,
          drillIds: currentDay.drillIds,
          notes: currentDay.notes,
          isCompleted,
        };
      },

      isCurrentDayCompleted: () => {
        const state = get();
        if (!state.activePlan) return false;

        const today = new Date().toISOString().split('T')[0];
        return state.activePlan.completedDays.some((d) => d.date === today);
      },
    }),
    {
      name: 'boxcoach-training-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activePlan: state.activePlan,
        completedPlans: state.completedPlans,
      }),
    }
  )
);

// Selectors
export const selectActivePlan = (state: TrainingStore) => state.activePlan;
export const selectHasActivePlan = (state: TrainingStore) => state.activePlan !== null;
export const selectCompletedPlans = (state: TrainingStore) => state.completedPlans;
