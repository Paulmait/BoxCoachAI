// Weight tracking store for competition boxers
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeightEntry } from '@/types/weight';

interface WeightState {
  entries: WeightEntry[];
  targetWeight: number | null;
  preferredUnit: 'lbs' | 'kg';
  fightDate: string | null;

  // Actions
  addEntry: (weight: number, notes?: string) => void;
  deleteEntry: (id: string) => void;
  setTargetWeight: (weight: number | null) => void;
  setFightDate: (date: string | null) => void;
  setPreferredUnit: (unit: 'lbs' | 'kg') => void;
  getLatestWeight: () => WeightEntry | null;
  getWeeklyAverage: () => number | null;
  getDaysUntilFight: () => number | null;
  getWeightTrend: () => 'gaining' | 'losing' | 'stable' | null;
}

export const useWeightStore = create<WeightState>()(
  persist(
    (set, get) => ({
      entries: [],
      targetWeight: null,
      preferredUnit: 'lbs',
      fightDate: null,

      addEntry: (weight: number, notes?: string) => {
        const entry: WeightEntry = {
          id: `weight_${Date.now()}`,
          date: new Date().toISOString(),
          weight,
          unit: get().preferredUnit,
          notes,
          fightWeightTarget: get().targetWeight || undefined,
        };
        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 365), // Keep 1 year of data
        }));
      },

      deleteEntry: (id: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      setTargetWeight: (weight: number | null) => {
        set({ targetWeight: weight });
      },

      setFightDate: (date: string | null) => {
        set({ fightDate: date });
      },

      setPreferredUnit: (unit: 'lbs' | 'kg') => {
        set({ preferredUnit: unit });
      },

      getLatestWeight: () => {
        const { entries } = get();
        return entries.length > 0 ? entries[0] : null;
      },

      getWeeklyAverage: () => {
        const { entries } = get();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weekEntries = entries.filter((e) => new Date(e.date) >= weekAgo);
        if (weekEntries.length === 0) return null;

        const sum = weekEntries.reduce((acc, e) => acc + e.weight, 0);
        return Math.round((sum / weekEntries.length) * 10) / 10;
      },

      getDaysUntilFight: () => {
        const { fightDate } = get();
        if (!fightDate) return null;

        const fight = new Date(fightDate);
        const today = new Date();
        const diffTime = fight.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : null;
      },

      getWeightTrend: () => {
        const { entries } = get();
        if (entries.length < 3) return null;

        const recent = entries.slice(0, 3);
        const avgRecent = recent.reduce((acc, e) => acc + e.weight, 0) / recent.length;

        const older = entries.slice(3, 6);
        if (older.length === 0) return null;
        const avgOlder = older.reduce((acc, e) => acc + e.weight, 0) / older.length;

        const diff = avgRecent - avgOlder;
        if (Math.abs(diff) < 0.5) return 'stable';
        return diff > 0 ? 'gaining' : 'losing';
      },
    }),
    {
      name: 'boxcoach-weight-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
