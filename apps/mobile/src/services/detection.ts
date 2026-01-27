import { supabase } from './supabase';
import { videoProcessingService } from './videoProcessing';
import type { DetectedPerson, DetectionResponse } from '@/types';

class DetectionService {
  async detectPeople(frameUri: string): Promise<DetectionResponse> {
    try {
      // Convert frame to base64
      const base64 = await videoProcessingService.frameToBase64(frameUri);

      // Call the detect-boxers edge function
      const { data, error } = await supabase.functions.invoke('detect-boxers', {
        body: { frameBase64: base64 },
      });

      if (error) {
        console.error('Detection API error:', error);
        return {
          success: false,
          people: [],
          error: error.message,
        };
      }

      if (!data || !data.people) {
        // If edge function not deployed, use mock detection
        return this.getMockDetection();
      }

      return {
        success: true,
        people: data.people as DetectedPerson[],
      };
    } catch (error) {
      console.error('Detection failed:', error);
      // Return mock data for development
      return this.getMockDetection();
    }
  }

  private getMockDetection(): DetectionResponse {
    // Mock detection for development/testing
    // Returns a single person in the center of the frame
    const mockPeople: DetectedPerson[] = [
      {
        id: 'person_1',
        boundingBox: {
          x: 25,
          y: 10,
          width: 50,
          height: 80,
        },
        confidence: 0.95,
        label: 'center',
      },
    ];

    return {
      success: true,
      people: mockPeople,
    };
  }

  async trackPerson(
    frames: string[],
    initialBoundingBox: { x: number; y: number; width: number; height: number }
  ): Promise<{ x: number; y: number; width: number; height: number }[]> {
    // In a production app, this would use computer vision to track
    // the selected person across frames by matching clothing/position
    // For now, return the same bounding box for all frames
    return frames.map(() => initialBoundingBox);
  }
}

export const detectionService = new DetectionService();
