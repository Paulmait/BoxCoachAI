import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { drillLibrary } from '@/data/drillLibrary';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { DrillStackScreenProps } from '@/navigation/types';
import type { BoxingDrill, DrillCategory } from '@/types';

type NavigationProp = DrillStackScreenProps<'DrillLibrary'>['navigation'];
type RouteProp = DrillStackScreenProps<'DrillLibrary'>['route'];

const CATEGORIES: { key: DrillCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fundamentals', label: 'Fundamentals' },
  { key: 'offense', label: 'Offense' },
  { key: 'defense', label: 'Defense' },
  { key: 'footwork', label: 'Footwork' },
  { key: 'conditioning', label: 'Conditioning' },
];

export function DrillLibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const recommendedDrillIds = route.params?.recommendedDrillIds;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DrillCategory | 'all'>('all');

  const filteredDrills = useMemo(() => {
    let drills = [...drillLibrary];

    // If we have recommended drills, put them first
    if (recommendedDrillIds && recommendedDrillIds.length > 0) {
      drills.sort((a, b) => {
        const aRecommended = recommendedDrillIds.includes(a.id);
        const bRecommended = recommendedDrillIds.includes(b.id);
        if (aRecommended && !bRecommended) return -1;
        if (!aRecommended && bRecommended) return 1;
        return 0;
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      drills = drills.filter((d) => d.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      drills = drills.filter(
        (d) => d.name.toLowerCase().includes(query) || d.description.toLowerCase().includes(query)
      );
    }

    return drills;
  }, [searchQuery, selectedCategory, recommendedDrillIds]);

  const renderDrillCard = ({ item }: { item: BoxingDrill }) => {
    const isRecommended = recommendedDrillIds?.includes(item.id);

    return (
      <Pressable
        style={styles.drillCard}
        onPress={() => navigation.navigate('DrillDetail', { drillId: item.id })}
      >
        <View style={styles.drillContent}>
          <View style={styles.drillHeader}>
            <View style={[styles.categoryBadge, getCategoryStyle(item.category)]}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            {isRecommended && (
              <View style={styles.recommendedBadge}>
                <Ionicons name="star" size={12} color={colors.accent} />
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
          </View>
          <Text style={styles.drillName}>{item.name}</Text>
          <Text style={styles.drillDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.drillMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>{item.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="fitness-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>{item.difficulty}</Text>
            </View>
            {item.equipment.length > 0 && item.equipment[0] !== 'none' && (
              <View style={styles.metaItem}>
                <Ionicons name="construct-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.metaText}>{item.equipment[0]}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Drill Library</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search drills..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === item.key && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.key)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.key && styles.categoryChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Drill List */}
      <FlatList
        data={filteredDrills}
        keyExtractor={(item) => item.id}
        renderItem={renderDrillCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No drills found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getCategoryStyle = (category: DrillCategory) => {
  const categoryColors: Record<DrillCategory, string> = {
    fundamentals: colors.info,
    offense: colors.primary,
    defense: colors.success,
    footwork: colors.warning,
    conditioning: colors.accent,
    combinations: colors.primary,
  };
  return { backgroundColor: categoryColors[category] + '20' };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  categoriesContainer: {
    marginTop: spacing.md,
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  drillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  drillContent: {
    flex: 1,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedText: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: '500',
  },
  drillName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  drillDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  drillMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
