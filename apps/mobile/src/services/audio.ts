// Audio Service for Timer Sounds
import { Audio, AVPlaybackSource } from 'expo-av';
import type { SoundType } from '@/types/audio';

// Sound objects cache
const sounds: Map<SoundType, Audio.Sound> = new Map();
let isInitialized = false;
let soundEnabled = true;

// Sound file mappings
const soundFiles: Record<SoundType, AVPlaybackSource> = {
  bell_start: require('../../assets/audio/bell_start.wav'),
  bell_end: require('../../assets/audio/bell_end.wav'),
  warning: require('../../assets/audio/warning.wav'),
  countdown: require('../../assets/audio/countdown.wav'),
  success: require('../../assets/audio/success.wav'),
  error: require('../../assets/audio/error.wav'),
};

/**
 * Initialize the audio service
 */
export async function initAudioService(): Promise<void> {
  if (isInitialized) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize audio service:', error);
  }
}

/**
 * Enable or disable sounds
 */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

/**
 * Check if sounds are enabled
 */
export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Play a sound by type
 */
export async function playSound(type: SoundType): Promise<void> {
  if (!soundEnabled) return;

  try {
    if (!isInitialized) {
      await initAudioService();
    }

    const soundFile = soundFiles[type];
    if (!soundFile) {
      console.warn(`Sound file not found for type: ${type}`);
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      soundFile,
      { shouldPlay: true, volume: 1.0 }
    );

    // Store reference for cleanup
    sounds.set(type, sound);

    // Auto-unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        sounds.delete(type);
      }
    });
  } catch (error) {
    console.debug('Sound playback failed:', error);
  }
}

/**
 * Play round start bell
 */
export async function playRoundStartBell(): Promise<void> {
  await playSound('bell_start');
}

/**
 * Play round end bell
 */
export async function playRoundEndBell(): Promise<void> {
  await playSound('bell_end');
}

/**
 * Play warning sound
 */
export async function playWarningSound(): Promise<void> {
  await playSound('warning');
}

/**
 * Play countdown beep
 */
export async function playCountdownBeep(): Promise<void> {
  await playSound('countdown');
}

/**
 * Play success sound
 */
export async function playSuccessSound(): Promise<void> {
  await playSound('success');
}

/**
 * Play error sound
 */
export async function playErrorSound(): Promise<void> {
  await playSound('error');
}

/**
 * Cleanup all loaded sounds
 */
export async function cleanupSounds(): Promise<void> {
  for (const sound of sounds.values()) {
    try {
      await sound.unloadAsync();
    } catch {
      // Ignore cleanup errors
    }
  }
  sounds.clear();
}

/**
 * Play timer transition sounds based on phase
 */
export async function playTimerTransition(
  _fromPhase: string,
  toPhase: string
): Promise<void> {
  if (toPhase === 'round') {
    await playRoundStartBell();
  } else if (toPhase === 'rest' || toPhase === 'complete') {
    await playRoundEndBell();
  } else if (toPhase === 'warning') {
    await playWarningSound();
  }
}
