// Video Comparison Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';

import { useVideoSync, formatVideoTime } from '@/hooks/useVideoSync';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing, fontSize, borderRadius, shadows } from '@/constants/theme';
import { hapticLight } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;

export function CompareScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { analysisId1, analysisId2 } = route.params || {};

  const analysisHistory = useAppStore((state) => state.analysisHistory);

  const analysis1 = analysisHistory.find((a) => a.id === analysisId1);
  const analysis2 = analysisHistory.find((a) => a.id === analysisId2);

  const {
    state,
    video1Ref,
    video2Ref,
    togglePlayPause,
    seek,
    toggleMute,
    restart,
  } = useVideoSync();

  const handleSeek = (value: number) => {
    hapticLight();
    seek(value);
  };

  if (!analysis1 || !analysis2) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Compare</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.errorText}>Could not load videos for comparison</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scoreChange = analysis2.overallScore - analysis1.overallScore;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Compare Progress</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Video Comparison */}
      <View style={styles.videosContainer}>
        <View style={styles.videoWrapper}>
          <Text style={styles.videoLabel}>Before</Text>
          <View style={styles.videoBox}>
            <Video
              ref={video1Ref}
              source={{ uri: analysis1.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={false}
            />
            <View style={styles.scoreOverlay}>
              <Text style={styles.scoreText}>{analysis1.overallScore}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            {new Date(analysis1.analyzedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.videoWrapper}>
          <Text style={styles.videoLabel}>After</Text>
          <View style={styles.videoBox}>
            <Video
              ref={video2Ref}
              source={{ uri: analysis2.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={false}
            />
            <View style={styles.scoreOverlay}>
              <Text style={styles.scoreText}>{analysis2.overallScore}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            {new Date(analysis2.analyzedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Improvement Badge */}
      <View style={styles.improvementContainer}>
        {scoreChange > 0 ? (
          <View style={[styles.improvementBadge, styles.improvementPositive]}>
            <Ionicons name="arrow-up" size={20} color={colors.success} />
            <Text style={styles.improvementText}>
              Improved by {scoreChange} points!
            </Text>
          </View>
        ) : scoreChange < 0 ? (
          <View style={[styles.improvementBadge, styles.improvementNegative]}>
            <Ionicons name="arrow-down" size={20} color={colors.error} />
            <Text style={[styles.improvementText, { color: colors.error }]}>
              Score decreased by {Math.abs(scoreChange)} points
            </Text>
          </View>
        ) : (
          <View style={styles.improvementBadge}>
            <Ionicons name="remove" size={20} color={colors.textSecondary} />
            <Text style={[styles.improvementText, { color: colors.textSecondary }]}>
              Same score
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatVideoTime(state.position)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={state.duration || 1}
            value={state.position}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
          <Text style={styles.timeText}>{formatVideoTime(state.duration)}</Text>
        </View>

        {/* Playback Controls */}
        <View style={styles.playbackControls}>
          <Pressable style={styles.controlButton} onPress={restart}>
            <Ionicons name="refresh" size={24} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            style={styles.playButton}
            onPress={() => {
              hapticLight();
              togglePlayPause();
            }}
          >
            <Ionicons
              name={state.isPlaying ? 'pause' : 'play'}
              size={32}
              color={colors.textPrimary}
            />
          </Pressable>

          <Pressable
            style={styles.controlButton}
            onPress={() => {
              hapticLight();
              toggleMute();
            }}
          >
            <Ionicons
              name={state.isMuted ? 'volume-mute' : 'volume-high'}
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      {/* Score Comparison */}
      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>Score Breakdown</Text>
        {analysis1.techniqueScores.slice(0, 4).map((score, index) => {
          const score2 = analysis2.techniqueScores[index];
          const change = score2 ? score2.score - score.score : 0;

          return (
            <View key={score.category} style={styles.scoreRow}>
              <Text style={styles.scoreCategory}>{score.category}</Text>
              <View style={styles.scoreValues}>
                <Text style={styles.scoreValue}>{score.score}</Text>
                <Ionicons
                  name={change >= 0 ? 'arrow-forward' : 'arrow-forward'}
                  size={16}
                  color={colors.textTertiary}
                />
                <Text style={styles.scoreValue}>{score2?.score || '-'}</Text>
                {change !== 0 && (
                  <Text
                    style={[
                      styles.scoreChange,
                      change > 0 ? styles.scoreChangePositive : styles.scoreChangeNegative,
                    ]}
                  >
                    {change > 0 ? '+' : ''}{change}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  videosContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  videoWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  videoLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  videoBox: {
    width: VIDEO_WIDTH,
    aspectRatio: 9 / 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
  scoreOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  improvementContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  improvementPositive: {
    backgroundColor: colors.success + '20',
  },
  improvementNegative: {
    backgroundColor: colors.error + '20',
  },
  improvementText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
  },
  slider: {
    flex: 1,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  scoresContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  scoresTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreCategory: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    flex: 1,
  },
  scoreValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  scoreChange: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  scoreChangePositive: {
    color: colors.success,
  },
  scoreChangeNegative: {
    color: colors.error,
  },
});
