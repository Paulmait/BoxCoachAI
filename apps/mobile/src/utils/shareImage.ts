// Share Image Utility
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { RefObject } from 'react';
import { View } from 'react-native';

/**
 * Capture a view and return the URI
 */
export async function captureView(
  viewRef: RefObject<View>,
  options?: {
    format?: 'png' | 'jpg';
    quality?: number;
    width?: number;
    height?: number;
  }
): Promise<string | null> {
  if (!viewRef.current) return null;

  try {
    const uri = await captureRef(viewRef, {
      format: options?.format || 'png',
      quality: options?.quality || 1,
      width: options?.width,
      height: options?.height,
      result: 'tmpfile',
    });
    return uri;
  } catch (error) {
    console.error('Failed to capture view:', error);
    return null;
  }
}

/**
 * Share an image file
 */
export async function shareImage(
  imageUri: string,
  options?: {
    mimeType?: string;
    dialogTitle?: string;
  }
): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing is not available on this device');
      return false;
    }

    await Sharing.shareAsync(imageUri, {
      mimeType: options?.mimeType || 'image/png',
      dialogTitle: options?.dialogTitle || 'Share your results',
    });
    return true;
  } catch (error) {
    console.error('Failed to share image:', error);
    return false;
  }
}

/**
 * Capture and share a view in one step
 */
export async function captureAndShare(
  viewRef: RefObject<View>,
  options?: {
    format?: 'png' | 'jpg';
    quality?: number;
    dialogTitle?: string;
  }
): Promise<boolean> {
  const uri = await captureView(viewRef, {
    format: options?.format || 'png',
    quality: options?.quality || 1,
  });

  if (!uri) return false;

  return shareImage(uri, {
    dialogTitle: options?.dialogTitle,
  });
}

/**
 * Save image to temporary directory with a custom name
 */
export async function saveTempImage(sourceUri: string, filename: string): Promise<string | null> {
  try {
    const tempDir = FileSystem.cacheDirectory;
    if (!tempDir) return null;

    const destUri = `${tempDir}${filename}`;
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });
    return destUri;
  } catch (error) {
    console.error('Failed to save temp image:', error);
    return null;
  }
}
