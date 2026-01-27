import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore, selectCanAnalyze, selectNeedsAIConsent } from '@/store/useAppStore';
import { videoProcessingService } from '@/services/videoProcessing';
import { AIConsentDialog } from '@/components/AIConsentDialog';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import type { HomeStackScreenProps } from '@/navigation/types';

type NavigationProp = HomeStackScreenProps<'Record'>['navigation'];

export function RecordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);

  const canAnalyze = useAppStore(selectCanAnalyze);
  const needsAIConsent = useAppStore(selectNeedsAIConsent);
  const setHasGivenAIConsent = useAppStore((state) => state.setHasGivenAIConsent);

  const processVideo = async (videoUri: string) => {
    if (needsAIConsent) {
      setPendingVideoUri(videoUri);
      setShowConsentDialog(true);
      return;
    }

    await proceedWithAnalysis(videoUri);
  };

  const proceedWithAnalysis = async (videoUri: string) => {
    setIsProcessing(true);
    try {
      const frameUri = await videoProcessingService.extractFirstFrame(videoUri);
      navigation.navigate('BoxerSelection', {
        videoUri,
        frameUri,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to process video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConsentAccept = async () => {
    setHasGivenAIConsent(true);
    setShowConsentDialog(false);
    if (pendingVideoUri) {
      await proceedWithAnalysis(pendingVideoUri);
      setPendingVideoUri(null);
    }
  };

  const handleConsentDecline = () => {
    setShowConsentDialog(false);
    setPendingVideoUri(null);
    Alert.alert(
      'AI Consent Required',
      'BoxCoach AI requires your consent to analyze videos. You can enable this in Settings later.'
    );
  };

  const handlePickVideo = async () => {
    if (!canAnalyze) {
      navigation.navigate('Paywall', { source: 'limit_reached' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      await processVideo(result.assets[0].uri);
    }
  };

  const handleRecordVideo = async () => {
    if (!canAnalyze) {
      navigation.navigate('Paywall', { source: 'limit_reached' });
      return;
    }

    if (!cameraRef.current) return;

    if (isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60,
        });
        if (video?.uri) {
          await processVideo(video.uri);
        }
      } catch (error) {
        console.error('Recording error:', error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="videocam-off" size={64} color={colors.textTertiary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            BoxCoach AI needs camera access to record your boxing technique for analysis
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.uploadButton} onPress={handlePickVideo}>
            <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
            <Text style={styles.uploadButtonText}>Upload from Library</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>Processing video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mode="video"
      >
        <SafeAreaView style={styles.cameraOverlay}>
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Position yourself so your full body is visible
            </Text>
          </View>

          <View style={styles.controls}>
            <Pressable style={styles.galleryButton} onPress={handlePickVideo}>
              <Ionicons name="images" size={28} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={handleRecordVideo}
            >
              <View style={[styles.recordInner, isRecording && styles.recordInnerActive]} />
            </Pressable>

            <View style={styles.galleryButton} />
          </View>
        </SafeAreaView>
      </CameraView>

      <AIConsentDialog
        visible={showConsentDialog}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  instructionText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.textPrimary,
  },
  recordButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  recordInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  recordInnerActive: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  permissionButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  uploadButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
});
