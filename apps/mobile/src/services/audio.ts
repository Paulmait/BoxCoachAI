// Audio Service for Timer Sounds
import { Audio } from 'expo-av';
import type { SoundType } from '@/types/audio';

// Sound objects cache
const sounds: Map<SoundType, Audio.Sound> = new Map();
let isInitialized = false;
let soundEnabled = true;

// Sound files - using built-in system sounds as fallback
// In production, you'd add actual audio files to assets/audio/

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
 * Note: Using expo-av for audio playback
 * For actual implementation, you would load audio files from assets
 */
export async function playSound(type: SoundType): Promise<void> {
  if (!soundEnabled) return;

  try {
    if (!isInitialized) {
      await initAudioService();
    }

    // Create and play a simple tone
    // In production, replace with actual audio file loading:
    // const { sound } = await Audio.Sound.createAsync(require('../../assets/audio/bell.mp3'));

    const { sound } = await Audio.Sound.createAsync(
      { uri: generateToneUri(type) },
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
    console.debug('Sound playback failed (expected on simulator):', error);
  }
}

/**
 * Generate a data URI for a simple tone
 * This is a placeholder - in production use actual audio files
 */
function generateToneUri(_type: SoundType): string {
  // For now, return empty - will fail gracefully
  // In production, you would return an actual audio file URI
  return '';
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
