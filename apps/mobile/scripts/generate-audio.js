/**
 * Audio File Generator for Boxing Coach AI
 *
 * This script generates simple audio files for the timer feature.
 * Run with: node scripts/generate-audio.js
 *
 * Note: For production, replace these with professionally recorded audio files.
 * These generated files are functional placeholders using sine wave synthesis.
 */

const fs = require('fs');
const path = require('path');

// Audio directory
const AUDIO_DIR = path.join(__dirname, '../assets/audio');

// Create directory if it doesn't exist
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Generate a WAV file with a sine wave tone
 * @param {string} filename - Output filename
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {number} volume - Volume (0-1)
 * @param {string} envelope - 'bell' for quick decay, 'sustained' for constant
 */
function generateTone(filename, frequency, duration, volume = 0.5, envelope = 'sustained') {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  // Create buffer for WAV file
  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // Chunk size
  buffer.writeUInt16LE(1, offset); offset += 2;  // Audio format (PCM)
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Generate audio samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = Math.sin(2 * Math.PI * frequency * t);

    // Apply envelope
    if (envelope === 'bell') {
      // Bell-like decay
      const decay = Math.exp(-t * 4);
      sample *= decay;
    } else if (envelope === 'beep') {
      // Quick beep with attack and release
      const attackTime = 0.01;
      const releaseStart = duration - 0.05;
      if (t < attackTime) {
        sample *= t / attackTime;
      } else if (t > releaseStart) {
        sample *= (duration - t) / 0.05;
      }
    }

    // Apply volume and convert to 16-bit
    const value = Math.floor(sample * volume * 32767);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, value)), offset);
    offset += 2;
  }

  // Write file
  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated: ${filepath}`);
}

/**
 * Generate compound bell sound (boxing gym bell)
 */
function generateBellSound(filename, duration = 1.5) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Bell frequencies (boxing gym bell harmonics)
  const frequencies = [800, 1200, 1600, 2400];
  const amplitudes = [0.4, 0.3, 0.2, 0.1];
  const decays = [3, 4, 5, 6];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (let j = 0; j < frequencies.length; j++) {
      const decay = Math.exp(-t * decays[j]);
      sample += Math.sin(2 * Math.PI * frequencies[j] * t) * amplitudes[j] * decay;
    }

    // Add slight metallic shimmer
    sample += Math.sin(2 * Math.PI * 3200 * t) * 0.05 * Math.exp(-t * 8);

    const value = Math.floor(sample * 32767);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, value)), offset);
    offset += 2;
  }

  const filepath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated: ${filepath}`);
}

// Generate audio files
console.log('Generating audio files for Boxing Coach AI...\n');

// Round bells
generateBellSound('bell_start.wav', 1.5);
generateBellSound('bell_end.wav', 2.0);

// Warning sound (higher pitch alert)
generateTone('warning.wav', 880, 0.3, 0.6, 'beep');

// Countdown beep
generateTone('countdown.wav', 660, 0.15, 0.5, 'beep');

// Success sound (pleasant major chord arpeggio simulation)
generateTone('success.wav', 523.25, 0.4, 0.4, 'bell'); // C5

// Error sound (lower warning tone)
generateTone('error.wav', 220, 0.3, 0.5, 'beep');

console.log('\nAudio generation complete!');
console.log('Files saved to:', AUDIO_DIR);
console.log('\nNote: For production, consider replacing these with professionally recorded audio.');
