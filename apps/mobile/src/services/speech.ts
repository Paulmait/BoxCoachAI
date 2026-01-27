// Speech Service for Audio Coaching
import * as Speech from 'expo-speech';
import type { AudioCoachingSettings } from '@/types/audio';

let currentSettings: AudioCoachingSettings = {
  enabled: true,
  volume: 1.0,
  rate: 1.0,
  pitch: 1.0,
  language: 'en-US',
};

let isSpeaking = false;
let speechQueue: string[] = [];
let isProcessingQueue = false;

/**
 * Update speech settings
 */
export function updateSpeechSettings(settings: Partial<AudioCoachingSettings>): void {
  currentSettings = { ...currentSettings, ...settings };
}

/**
 * Get current speech settings
 */
export function getSpeechSettings(): AudioCoachingSettings {
  return { ...currentSettings };
}

/**
 * Check if speech is currently active
 */
export function isSpeechActive(): boolean {
  return isSpeaking;
}

/**
 * Speak text immediately
 */
export async function speak(text: string, options?: Partial<AudioCoachingSettings>): Promise<void> {
  if (!currentSettings.enabled) return;

  const settings = { ...currentSettings, ...options };

  return new Promise((resolve, reject) => {
    isSpeaking = true;

    Speech.speak(text, {
      language: settings.language,
      pitch: settings.pitch,
      rate: settings.rate,
      volume: settings.volume,
      onDone: () => {
        isSpeaking = false;
        resolve();
      },
      onError: (error) => {
        isSpeaking = false;
        reject(error);
      },
      onStopped: () => {
        isSpeaking = false;
        resolve();
      },
    });
  });
}

/**
 * Add text to speech queue
 */
export function queueSpeech(text: string): void {
  speechQueue.push(text);
  processQueue();
}

/**
 * Process speech queue
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || speechQueue.length === 0) return;

  isProcessingQueue = true;

  while (speechQueue.length > 0) {
    const text = speechQueue.shift();
    if (text) {
      try {
        await speak(text);
        // Small pause between queued items
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.debug('Speech failed:', error);
      }
    }
  }

  isProcessingQueue = false;
}

/**
 * Stop current speech and clear queue
 */
export function stopSpeech(): void {
  Speech.stop();
  speechQueue = [];
  isSpeaking = false;
  isProcessingQueue = false;
}

/**
 * Speak a drill instruction
 */
export async function speakInstruction(instruction: string): Promise<void> {
  await speak(instruction, { rate: 0.95 });
}

/**
 * Speak a punch combination callout
 */
export async function speakComboCallout(callout: string): Promise<void> {
  await speak(callout, { rate: 1.2, pitch: 1.1 });
}

/**
 * Speak countdown numbers
 */
export async function speakCountdown(seconds: number): Promise<void> {
  if (seconds <= 10 && seconds > 0) {
    await speak(seconds.toString(), { rate: 1.3, pitch: 1.0 });
  }
}

/**
 * Speak timer phase announcements
 */
export async function speakTimerPhase(
  phase: 'round' | 'rest' | 'complete',
  roundNumber?: number,
  totalRounds?: number
): Promise<void> {
  let announcement = '';

  switch (phase) {
    case 'round':
      announcement =
        roundNumber && totalRounds ? `Round ${roundNumber} of ${totalRounds}. Fight!` : 'Fight!';
      break;
    case 'rest':
      announcement = 'Time! Rest.';
      break;
    case 'complete':
      announcement = 'Workout complete! Great job!';
      break;
  }

  await speak(announcement, { rate: 1.0, pitch: 1.0 });
}

/**
 * Check if speech is available on this device
 */
export async function isSpeechAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get available voices for a language
 */
export async function getVoices(language?: string): Promise<Speech.Voice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (language) {
      return voices.filter((v) => v.language.startsWith(language));
    }
    return voices;
  } catch {
    return [];
  }
}
