// Training Journal Store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  JournalEntry,
  JournalEntryType,
  Mood,
  Intensity,
  JournalStats,
  CalendarDay,
} from '@/types/journal';

interface JournalStore {
  entries: JournalEntry[];

  // Actions
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (id: string) => JournalEntry | undefined;
  getEntriesByDate: (date: string) => JournalEntry[];
  getEntriesByMonth: (year: number, month: number) => JournalEntry[];
  getCalendarDays: (year: number, month: number) => CalendarDay[];
  getStats: () => JournalStats;
  linkDrillToEntry: (entryId: string, drillId: string) => void;
  linkAnalysisToEntry: (entryId: string, analysisId: string) => void;
}

function generateId(): string {
  return `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entryData) => {
        const id = generateId();
        const now = new Date().toISOString();

        const entry: JournalEntry = {
          ...entryData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          entries: [entry, ...state.entries],
        }));

        return id;
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
              : entry
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      getEntry: (id) => {
        return get().entries.find((entry) => entry.id === id);
      },

      getEntriesByDate: (date) => {
        return get().entries.filter((entry) => entry.date === date);
      },

      getEntriesByMonth: (year, month) => {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        return get().entries.filter((entry) => {
          return entry.date >= startDate && entry.date <= endDate;
        });
      },

      getCalendarDays: (year, month) => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const entries = get().getEntriesByMonth(year, month);
        const calendarDays: CalendarDay[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month - 1, day).toISOString().split('T')[0];
          const dayEntries = entries.filter((e) => e.date === date);

          calendarDays.push({
            date,
            hasEntry: dayEntries.length > 0,
            entries: dayEntries,
          });
        }

        return calendarDays;
      },

      getStats: () => {
        const entries = get().entries;

        const entriesByType: Record<JournalEntryType, number> = {
          sparring: 0,
          bag_work: 0,
          pad_work: 0,
          gym_session: 0,
          cardio: 0,
          strength: 0,
          drill: 0,
          analysis: 0,
          custom: 0,
        };

        let totalDuration = 0;
        let moodSum = 0;
        let moodCount = 0;
        let intensitySum = 0;
        let intensityCount = 0;

        const dayCount: Record<string, number> = {
          Sunday: 0,
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0,
        };

        const moodValues: Record<Mood, number> = {
          great: 5,
          good: 4,
          okay: 3,
          tired: 2,
          struggling: 1,
        };

        const intensityValues: Record<Intensity, number> = {
          light: 1,
          moderate: 2,
          hard: 3,
          intense: 4,
        };

        for (const entry of entries) {
          entriesByType[entry.type]++;

          if (entry.duration) {
            totalDuration += entry.duration;
          }

          if (entry.mood) {
            moodSum += moodValues[entry.mood];
            moodCount++;
          }

          if (entry.intensity) {
            intensitySum += intensityValues[entry.intensity];
            intensityCount++;
          }

          const dayOfWeek = new Date(entry.date).toLocaleDateString('en-US', {
            weekday: 'long',
          });
          dayCount[dayOfWeek]++;
        }

        // Find most active day
        let mostActiveDay = 'Monday';
        let maxCount = 0;
        for (const [day, count] of Object.entries(dayCount)) {
          if (count > maxCount) {
            maxCount = count;
            mostActiveDay = day;
          }
        }

        return {
          totalEntries: entries.length,
          totalDuration,
          entriesByType,
          averageMood: moodCount > 0 ? moodSum / moodCount : 0,
          averageIntensity: intensityCount > 0 ? intensitySum / intensityCount : 0,
          mostActiveDay,
        };
      },

      linkDrillToEntry: (entryId, drillId) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, linkedDrillId: drillId, updatedAt: new Date().toISOString() }
              : entry
          ),
        }));
      },

      linkAnalysisToEntry: (entryId, analysisId) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, linkedAnalysisId: analysisId, updatedAt: new Date().toISOString() }
              : entry
          ),
        }));
      },
    }),
    {
      name: 'boxcoach-journal-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
      }),
    }
  )
);

// Selectors
export const selectAllEntries = (state: JournalStore) => state.entries;
export const selectRecentEntries = (state: JournalStore, limit: number = 10) =>
  state.entries.slice(0, limit);
export const selectTodayEntries = (state: JournalStore) => {
  const today = new Date().toISOString().split('T')[0];
  return state.entries.filter((e) => e.date === today);
};
