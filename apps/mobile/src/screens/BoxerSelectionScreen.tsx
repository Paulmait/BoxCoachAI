import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { detectionService } from '@/services/detection';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { HomeStackScreenProps } from '@/navigation/types';
import type { DetectedPerson } from '@/types';

type NavigationProp = HomeStackScreenProps<'BoxerSelection'>['navigation'];
type RouteProp = HomeStackScreenProps<'BoxerSelection'>['route'];

const IMAGE_ASPECT_RATIO = 16 / 9;

export function BoxerSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { videoUri, frameUri } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [detectedPeople, setDetectedPeople] = useState<DetectedPerson[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    detectBoxers();
  }, []);

  const detectBoxers = async () => {
    setIsLoading(true);
    try {
      const result = await detectionService.detectPeople(frameUri);
      if (result.success && result.people.length > 0) {
        setDetectedPeople(result.people);

        // Auto-select if only one person detected
        if (result.people.length === 1) {
          setSelectedPersonId(result.people[0]?.id ?? null);
        }
      } else if (result.people.length === 0) {
        Alert.alert(
          'No People Detected',
          'We couldn\'t detect anyone in the video. Please ensure you\'re clearly visible in frame.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Detection Error', 'Failed to detect people in the video.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
  };

  const handleContinue = () => {
    if (!selectedPersonId) {
      Alert.alert('Select Yourself', 'Please tap on yourself in the image to continue.');
      return;
    }

    // Store selection and navigate to analysis
    navigation.navigate('Analyzing', {
      videoUri,
      boxerSelectionId: selectedPersonId,
    });
  };

  const renderBoundingBox = (person: DetectedPerson) => {
    const isSelected = selectedPersonId === person.id;
    const { x, y, width, height } = person.boundingBox;

    // Convert percentage to actual pixels based on image layout
    const boxStyle = {
      left: (x / 100) * imageLayout.width,
      top: (y / 100) * imageLayout.height,
      width: (width / 100) * imageLayout.width,
      height: (height / 100) * imageLayout.height,
    };

    return (
      <Pressable
        key={person.id}
        style={[
          styles.boundingBox,
          boxStyle,
          isSelected && styles.boundingBoxSelected,
        ]}
        onPress={() => handleSelectPerson(person.id)}
      >
        {person.label && (
          <View style={[styles.personLabel, isSelected && styles.personLabelSelected]}>
            <Text style={styles.personLabelText}>{person.label}</Text>
          </View>
        )}
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
          </View>
        )}
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Detecting people in video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Select Yourself</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Tap on yourself in the image below so we know who to analyze
        </Text>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: frameUri }}
            style={styles.frameImage}
            resizeMode="contain"
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setImageLayout({ width, height });
            }}
          />

          {imageLayout.width > 0 && detectedPeople.map(renderBoundingBox)}
        </View>

        {detectedPeople.length > 1 && (
          <View style={styles.hint}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.hintText}>
              We detected {detectedPeople.length} people. Tap on yourself to continue.
            </Text>
          </View>
        )}

        {detectedPeople.length === 1 && (
          <View style={styles.hint}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.hintText}>
              We detected you in the video. Confirm to continue.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.continueButton,
            !selectedPersonId && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedPersonId}
        >
          <Text style={styles.continueButtonText}>Analyze My Technique</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textPrimary} />
        </Pressable>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  instructions: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: IMAGE_ASPECT_RATIO,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.sm,
  },
  boundingBoxSelected: {
    borderColor: colors.success,
    borderStyle: 'solid',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  personLabel: {
    position: 'absolute',
    top: -24,
    left: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  personLabelSelected: {
    backgroundColor: colors.success,
  },
  personLabelText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 16,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  hintText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  continueButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  continueButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
