import { supabase } from './supabase';
import { videoProcessingService } from './videoProcessing';
import { useAppStore } from '@/store/useAppStore';
import type { AnalysisRequest, AnalysisResponse, TechniqueAnalysis } from '@/types';

class AnalysisService {
  async analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const user = useAppStore.getState().user;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // 1. Upload video to Supabase Storage
      const videoPath = videoProcessingService.generateVideoPath(user.id);
      const uploadResult = await this.uploadVideo(request.videoUri, videoPath);

      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload video' };
      }

      // 2. Extract key frames
      const duration = await videoProcessingService.getVideoDuration(request.videoUri);
      const frameUris = await videoProcessingService.extractKeyFrames(request.videoUri, duration);

      // 3. Convert frames to base64
      const framesBase64: string[] = [];
      for (const uri of frameUris) {
        const base64 = await videoProcessingService.frameToBase64(uri);
        framesBase64.push(base64);
      }

      // 4. Call analyze-boxing edge function
      const { data, error } = await supabase.functions.invoke('analyze-boxing', {
        body: {
          frames: framesBase64,
          boxerSelection: request.boxerSelection,
          userStance: request.userStance,
          experienceLevel: request.experienceLevel,
        },
      });

      // Cleanup temp files
      await videoProcessingService.cleanupTempFiles(frameUris);

      if (error) {
        console.error('Analysis API error:', error);
        return {
          success: false,
          error: error.message || 'Analysis service is temporarily unavailable. Please try again.',
        };
      }

      if (!data || !data.analysis) {
        return {
          success: false,
          error: 'Unable to analyze video. Please ensure good lighting and try again.',
        };
      }

      // 5. Store analysis in database
      const analysis = this.mapResponseToAnalysis(data.analysis, user.id, uploadResult.url || '');

      const { error: insertError } = await supabase.from('analyses').insert({
        id: analysis.id,
        user_id: analysis.userId,
        video_url: analysis.videoUrl,
        overall_score: analysis.overallScore,
        stance: analysis.stance,
        technique_scores: analysis.techniqueScores,
        root_causes: analysis.rootCauses,
        summary: analysis.summary,
        top_strengths: analysis.topStrengths,
        priority_improvements: analysis.priorityImprovements,
        recommended_drills: analysis.recommendedDrills,
        boxer_selection: analysis.boxerSelection,
        analyzed_at: analysis.analyzedAt,
      });

      if (insertError) {
        console.warn('Failed to store analysis:', insertError);
      }

      return { success: true, analysis };
    } catch (error) {
      console.error('Analysis failed:', error);
      return { success: false, error: 'Analysis failed' };
    }
  }

  private async uploadVideo(
    localUri: string,
    path: string
  ): Promise<{ success: boolean; url?: string }> {
    try {
      // Read file
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error } = await supabase.storage.from('videos').upload(path, blob, {
        contentType: 'video/mp4',
        upsert: true,
      });

      if (error) {
        console.error('Upload error:', error);
        return { success: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Upload failed:', error);
      return { success: false };
    }
  }

  private mapResponseToAnalysis(
    responseData: any,
    userId: string,
    videoUrl: string
  ): TechniqueAnalysis {
    return {
      id: `analysis_${Date.now()}`,
      userId,
      videoUrl,
      overallScore: responseData.overallScore || 65,
      stance: responseData.stance || 'orthodox',
      techniqueScores: responseData.techniqueScores || [],
      rootCauses: responseData.rootCauses || [],
      summary: responseData.summary || '',
      topStrengths: responseData.topStrengths || [],
      priorityImprovements: responseData.priorityImprovements || [],
      recommendedDrills: responseData.recommendedDrills || [],
      createdAt: new Date().toISOString(),
      analyzedAt: new Date().toISOString(),
    };
  }
}

export const analysisService = new AnalysisService();
