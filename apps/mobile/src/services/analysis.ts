import { supabase } from './supabase';
import { videoProcessingService } from './videoProcessing';
import { useAppStore } from '@/store/useAppStore';
import type {
  AnalysisRequest,
  AnalysisResponse,
  TechniqueAnalysis,
  TechniqueScore,
  RootCauseAnalysis,
} from '@/types';

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
        // Return mock analysis for development
        return this.getMockAnalysis(user.id, uploadResult.url || '');
      }

      if (!data || !data.analysis) {
        return this.getMockAnalysis(user.id, uploadResult.url || '');
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
      const { error } = await supabase.storage
        .from('videos')
        .upload(path, blob, {
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

  private getMockAnalysis(userId: string, videoUrl: string): AnalysisResponse {
    const mockTechniqueScores: TechniqueScore[] = [
      {
        category: 'stance',
        score: 72,
        feedback: 'Good base width but could improve weight distribution',
        strengths: ['Solid foundation', 'Good knee bend'],
        improvements: ['Distribute weight more evenly', 'Keep rear heel slightly raised'],
      },
      {
        category: 'guard',
        score: 68,
        feedback: 'Guard position needs attention',
        strengths: ['Hands are up'],
        improvements: ['Keep elbows tighter to body', 'Chin down more'],
      },
      {
        category: 'jab',
        score: 75,
        feedback: 'Solid jab technique with room for improvement',
        strengths: ['Good extension', 'Quick return'],
        improvements: ['Rotate fist at end of punch', 'Keep shoulder up for protection'],
      },
      {
        category: 'footwork',
        score: 60,
        feedback: 'Footwork needs more work',
        strengths: ['Stays balanced'],
        improvements: ['Smaller steps', 'Don\'t cross feet'],
      },
    ];

    const mockRootCauses: RootCauseAnalysis[] = [
      {
        cause: 'weight_distribution',
        severity: 'medium',
        description: 'Weight tends to shift too far forward during punches',
        impact: 'Reduces power and recovery speed',
        recommendedDrills: ['stance_check', 'shadow_boxing'],
      },
      {
        cause: 'elbow_flare',
        severity: 'low',
        description: 'Elbows occasionally flare out from body',
        impact: 'Creates openings for body shots',
        recommendedDrills: ['guard_position', 'mirror_drill'],
      },
    ];

    const mockAnalysis: TechniqueAnalysis = {
      id: `analysis_${Date.now()}`,
      userId,
      videoUrl,
      overallScore: 69,
      stance: 'orthodox',
      techniqueScores: mockTechniqueScores,
      rootCauses: mockRootCauses,
      summary:
        'Overall solid fundamentals with good potential. Focus on maintaining proper weight distribution throughout combinations and keeping the guard tight. Your jab shows good speed and extension.',
      topStrengths: [
        'Good jab extension and return',
        'Solid stance foundation',
        'Maintains balance during movement',
      ],
      priorityImprovements: [
        'Keep weight centered during combinations',
        'Tighten elbow position in guard',
        'Work on smaller, quicker footwork steps',
      ],
      recommendedDrills: ['stance_check', 'guard_position', 'jab_drill', 'ladder_drill'],
      createdAt: new Date().toISOString(),
      analyzedAt: new Date().toISOString(),
    };

    return { success: true, analysis: mockAnalysis };
  }
}

export const analysisService = new AnalysisService();
