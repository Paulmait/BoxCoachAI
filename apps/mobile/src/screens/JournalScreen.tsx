// Training Journal Screen
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useJournalStore } from '@/store/useJournalStore';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';
import type { JournalEntryType, CalendarDay } from '@/types/journal';

const ENTRY_TYPES: { type: JournalEntryType; label: string; icon: string }[] = [
  { type: 'sparring', label: 'Sparring', icon: 'people' },
  { type: 'bag_work', label: 'Bag Work', icon: 'fitness' },
  { type: 'pad_work', label: 'Pad Work', icon: 'hand-left' },
  { type: 'gym_session', label: 'Gym Session', icon: 'barbell' },
  { type: 'cardio', label: 'Cardio', icon: 'bicycle' },
  { type: 'strength', label: 'Strength', icon: 'trophy' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function JournalScreen() {
  const navigation = useNavigation<any>();
  const entries = useJournalStore((state) => state.entries);
  const addEntry = useJournalStore((state) => state.addEntry);
  const getCalendarDays = useJournalStore((state) => state.getCalendarDays);
  const getStats = useJournalStore((state) => state.getStats);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const stats = getStats();
  const calendarDays = getCalendarDays(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1
  );

  const handlePrevMonth = useCallback(() => {
    hapticLight();
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    hapticLight();
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    hapticLight();
    setSelectedDate(date);
  }, []);

  const handleAddEntry = useCallback((type: JournalEntryType) => {
    hapticLight();
    const today = new Date().toISOString().split('T')[0];
    addEntry({
      date: selectedDate || today,
      type,
      title: `${ENTRY_TYPES.find((t) => t.type === type)?.label || 'Training'} Session`,
    });
  }, [addEntry, selectedDate]);

  // Build calendar grid
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const calendarGrid: (CalendarDay | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }
  calendarGrid.push(...calendarDays);

  const selectedDayEntries = selectedDate
    ? entries.filter((e) => e.date === selectedDate)
    : [];

  const today = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Training Journal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(stats.totalDuration / 60)}h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.mostActiveDay.substring(0, 3)}</Text>
            <Text style={styles.statLabel}>Best Day</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendar}>
          {/* Month Header */}
          <View style={styles.monthHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.monthText}>
              {currentMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarGrid.map((day, index) => (
              <Pressable
                key={index}
                style={[
                  styles.calendarDay,
                  day?.date === selectedDate && styles.calendarDaySelected,
                  day?.date === today && styles.calendarDayToday,
                ]}
                onPress={() => day && handleDateSelect(day.date)}
                disabled={!day}
              >
                {day && (
                  <>
                    <Text
                      style={[
                        styles.calendarDayText,
                        day.date === selectedDate && styles.calendarDayTextSelected,
                      ]}
                    >
                      {parseInt(day.date.split('-')[2], 10)}
                    </Text>
                    {day.hasEntry && (
                      <View style={styles.entryIndicator} />
                    )}
                  </>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Selected Day Entries */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>

            {selectedDayEntries.length > 0 ? (
              selectedDayEntries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryIcon}>
                    <Ionicons
                      name={
                        ENTRY_TYPES.find((t) => t.type === entry.type)?.icon as any ||
                        'fitness'
                      }
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryType}>
                        {ENTRY_TYPES.find((t) => t.type === entry.type)?.label}
                      </Text>
                      {entry.duration && (
                        <Text style={styles.entryDuration}>{entry.duration} min</Text>
                      )}
                    </View>
                    {entry.notes && (
                      <Text style={styles.entryNotes} numberOfLines={2}>
                        {entry.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noEntries}>No entries for this day</Text>
            )}
          </View>
        )}

        {/* Quick Add */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddGrid}>
            {ENTRY_TYPES.map((type) => (
              <Pressable
                key={type.type}
                style={styles.quickAddButton}
                onPress={() => handleAddEntry(type.type)}
              >
                <Ionicons name={type.icon as any} size={24} color={colors.textPrimary} />
                <Text style={styles.quickAddText}>{type.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  calendar: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthButton: {
    padding: spacing.sm,
  },
  monthText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  calendarDayText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  calendarDayTextSelected: {
    fontWeight: '700',
  },
  entryIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  entryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  entryMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  entryType: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  entryDuration: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  entryNotes: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  noEntries: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAddButton: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickAddText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
