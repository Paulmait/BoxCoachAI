import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

interface CompressedFrame {
  base64: string;
  width: number;
  height: number;
}

class VideoProcessingService {
  private readonly MAX_WIDTH = 1280;
  private readonly JPEG_QUALITY = 0.8;
  private readonly KEY_FRAME_COUNT = 5;

  async extractFirstFrame(videoUri: string): Promise<string> {
    try {
      const result = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: this.JPEG_QUALITY,
      });
      return result.uri;
    } catch (error) {
      console.error('Failed to extract first frame:', error);
      throw new Error('Failed to extract video frame');
    }
  }

  async extractKeyFrames(videoUri: string, durationMs: number): Promise<string[]> {
    const frames: string[] = [];
    const interval = durationMs / (this.KEY_FRAME_COUNT + 1);

    try {
      for (let i = 1; i <= this.KEY_FRAME_COUNT; i++) {
        const timeMs = Math.floor(interval * i);
        const result = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: timeMs,
          quality: this.JPEG_QUALITY,
        });
        frames.push(result.uri);
      }
      return frames;
    } catch (error) {
      console.error('Failed to extract key frames:', error);
      // Return whatever frames we got
      return frames;
    }
  }

  async compressFrame(frameUri: string): Promise<CompressedFrame> {
    try {
      // Get image dimensions
      const dimensions = await this.getImageDimensions(frameUri);

      // Calculate new dimensions maintaining aspect ratio
      let newWidth = dimensions.width;
      let newHeight = dimensions.height;

      if (newWidth > this.MAX_WIDTH) {
        const ratio = this.MAX_WIDTH / newWidth;
        newWidth = this.MAX_WIDTH;
        newHeight = Math.floor(dimensions.height * ratio);
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(frameUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        base64,
        width: newWidth,
        height: newHeight,
      };
    } catch (error) {
      console.error('Failed to compress frame:', error);
      throw new Error('Failed to compress video frame');
    }
  }

  async frameToBase64(frameUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(frameUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Failed to convert frame to base64:', error);
      throw new Error('Failed to process video frame');
    }
  }

  async getVideoDuration(_videoUri: string): Promise<number> {
    // expo-av can be used to get video duration, but for simplicity
    // we'll estimate based on file size or use a default
    // In a real implementation, you'd use expo-av's Video component
    // or a native module to get the actual duration
    return 10000; // Default 10 seconds
  }

  private getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });
  }

  async cleanupTempFiles(uris: string[]): Promise<void> {
    for (const uri of uris) {
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch (error) {
        console.warn('Failed to cleanup temp file:', uri);
      }
    }
  }

  generateVideoPath(userId: string): string {
    const timestamp = Date.now();
    return `${userId}/video_${timestamp}.mp4`;
  }
}

export const videoProcessingService = new VideoProcessingService();
