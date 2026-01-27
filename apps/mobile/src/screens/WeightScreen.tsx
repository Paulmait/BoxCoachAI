import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWeightStore } from '@/store/useWeightStore';
import { getWeightClass, AMATEUR_WEIGHT_CLASSES } from '@/types/weight';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export function WeightScreen() {
  const {
    entries,
    targetWeight,
    preferredUnit,
    addEntry,
    deleteEntry,
    setTargetWeight,
    setPreferredUnit,
    getLatestWeight,
    getWeeklyAverage,
    getDaysUntilFight,
    getWeightTrend,
  } = useWeightStore();

  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const latestWeight = getLatestWeight();
  const weeklyAverage = getWeeklyAverage();
  const daysUntilFight = getDaysUntilFight();
  const weightTrend = getWeightTrend();
  const currentClass = latestWeight ? getWeightClass(latestWeight.weight, latestWeight.unit) : null;

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight');
      return;
    }
    addEntry(weight, notes || undefined);
    setNewWeight('');
    setNotes('');
    setShowAddWeight(false);
  };

  const handleSetTarget = () => {
    const target = parseFloat(targetInput);
    if (isNaN(target) || target <= 0) {
      setTargetWeight(null);
    } else {
      setTargetWeight(target);
    }
    setShowTargetModal(false);
    setTargetInput('');
  };

  const getTrendIcon = () => {
    switch (weightTrend) {
      case 'gaining':
        return <Ionicons name="trending-up" size={20} color={colors.error} />;
      case 'losing':
        return <Ionicons name="trending-down" size={20} color={colors.success} />;
      case 'stable':
        return <Ionicons name="remove" size={20} color={colors.textSecondary} />;
      default:
        return null;
    }
  };

  const getWeightDiff = () => {
    if (!latestWeight || !targetWeight) return null;
    const diff = latestWeight.weight - targetWeight;
    return diff;
  };

  const weightDiff = getWeightDiff();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weight Tracker</Text>
          <Pressable
            style={styles.unitToggle}
            onPress={() => setPreferredUnit(preferredUnit === 'lbs' ? 'kg' : 'lbs')}
          >
            <Text style={styles.unitText}>{preferredUnit.toUpperCase()}</Text>
          </Pressable>
        </View>

        {/* Current Weight Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current Weight</Text>
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>
              {latestWeight ? latestWeight.weight.toFixed(1) : '--'}
            </Text>
            <Text style={styles.weightUnit}>{preferredUnit}</Text>
            {getTrendIcon()}
          </View>
          {currentClass && <Text style={styles.weightClass}>{currentClass.name}</Text>}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Target</Text>
            <Pressable onPress={() => setShowTargetModal(true)}>
              <Text style={styles.statValue}>
                {targetWeight ? `${targetWeight} ${preferredUnit}` : 'Set'}
              </Text>
            </Pressable>
            {weightDiff !== null && (
              <Text
                style={[
                  styles.diffText,
                  weightDiff > 0 ? styles.diffNegative : styles.diffPositive,
                ]}
              >
                {weightDiff > 0
                  ? `${weightDiff.toFixed(1)} over`
                  : `${Math.abs(weightDiff).toFixed(1)} under`}
              </Text>
            )}
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>7-Day Avg</Text>
            <Text style={styles.statValue}>
              {weeklyAverage ? `${weeklyAverage} ${preferredUnit}` : '--'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fight In</Text>
            <Pressable
              onPress={() => {
                // In a real app, show date picker
                Alert.alert('Set Fight Date', 'Date picker would appear here');
              }}
            >
              <Text style={styles.statValue}>
                {daysUntilFight ? `${daysUntilFight} days` : 'Set'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Weight Classes Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weight Classes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {AMATEUR_WEIGHT_CLASSES.slice(0, -1).map((wc) => (
              <View
                key={wc.name}
                style={[styles.classChip, currentClass?.name === wc.name && styles.classChipActive]}
              >
                <Text
                  style={[
                    styles.classChipText,
                    currentClass?.name === wc.name && styles.classChipTextActive,
                  ]}
                >
                  {wc.name}
                </Text>
                <Text style={styles.classChipWeight}>≤{wc.maxWeight} lbs</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Add Weight Button */}
        {!showAddWeight ? (
          <Pressable style={styles.addButton} onPress={() => setShowAddWeight(true)}>
            <Ionicons name="add" size={24} color={colors.textPrimary} />
            <Text style={styles.addButtonText}>Log Weight</Text>
          </Pressable>
        ) : (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder={`Weight (${preferredUnit})`}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
            />
            <View style={styles.formButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setShowAddWeight(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleAddWeight}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No weight entries yet. Start tracking today!</Text>
          ) : (
            entries.slice(0, 14).map((entry) => (
              <View key={entry.id} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyWeight}>
                    {entry.weight.toFixed(1)} {entry.unit}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                  {entry.notes && <Text style={styles.historyNotes}>{entry.notes}</Text>}
                </View>
                <Pressable onPress={() => deleteEntry(entry.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Target Weight Modal */}
        {showTargetModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Set Target Weight</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={`Target (${preferredUnit})`}
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                value={targetInput}
                onChangeText={setTargetInput}
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancel} onPress={() => setShowTargetModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSave} onPress={handleSetTarget}>
                  <Text style={styles.modalSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary },
  unitToggle: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  unitText: { color: colors.primary, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  cardLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  weightRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  weightValue: { fontSize: 48, fontWeight: '700', color: colors.textPrimary },
  weightUnit: { fontSize: fontSize.lg, color: colors.textSecondary },
  weightClass: { fontSize: fontSize.md, color: colors.primary, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: { fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: spacing.xs },
  statValue: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  diffText: { fontSize: fontSize.xs, marginTop: spacing.xs },
  diffPositive: { color: colors.success },
  diffNegative: { color: colors.error },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  classChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  classChipActive: { backgroundColor: colors.primary },
  classChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  classChipTextActive: { color: colors.textPrimary },
  classChipWeight: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  addButtonText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  addForm: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  notesInput: { height: 60 },
  formButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  cancelButtonText: { color: colors.textSecondary, fontWeight: '500' },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  saveButtonText: { color: colors.textPrimary, fontWeight: '600' },
  emptyText: { color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing.lg },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  historyWeight: { fontSize: fontSize.md, fontWeight: '600', color: colors.textPrimary },
  historyDate: { fontSize: fontSize.sm, color: colors.textSecondary },
  historyNotes: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalCancel: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalCancelText: { color: colors.textSecondary },
  modalSave: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  modalSaveText: { color: colors.textPrimary, fontWeight: '600' },
});
