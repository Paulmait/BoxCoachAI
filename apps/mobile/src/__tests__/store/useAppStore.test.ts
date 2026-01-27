import { renderHook, act } from '@testing-library/react-native';
import {
  useAppStore,
  selectCanAnalyze,
  selectRemainingAnalyses,
  FREE_ANALYSIS_LIMIT,
} from '@/store/useAppStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      isInitialized: false,
      user: null,
      isPremium: false,
      analysesUsedToday: 0,
      lastAnalysisDate: null,
      currentAnalysis: null,
      analysisHistory: [],
      pendingAnalyses: [],
      preferences: {
        biometricsEnabled: false,
        notificationsEnabled: true,
        preferredDrillDuration: 15,
        aiConsentGiven: false,
      },
      hasCompletedOnboarding: false,
      hasGivenAIConsent: false,
    });
  });

  describe('initialization', () => {
    it('should initialize store', async () => {
      const { result } = renderHook(() => useAppStore());

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe('analysis tracking', () => {
    it('should increment analyses used', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.incrementAnalysesUsed();
      });

      expect(result.current.analysesUsedToday).toBe(1);
    });

    it('should track last analysis date', () => {
      const { result } = renderHook(() => useAppStore());
      const today = new Date().toISOString().split('T')[0];

      act(() => {
        result.current.incrementAnalysesUsed();
      });

      expect(result.current.lastAnalysisDate).toBe(today);
    });

    it('should reset daily analyses', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.incrementAnalysesUsed();
        result.current.incrementAnalysesUsed();
        result.current.resetDailyAnalyses();
      });

      expect(result.current.analysesUsedToday).toBe(0);
    });
  });

  describe('selectors', () => {
    it('selectCanAnalyze returns true when under limit', () => {
      useAppStore.setState({ analysesUsedToday: 0, isPremium: false });
      expect(selectCanAnalyze(useAppStore.getState())).toBe(true);
    });

    it('selectCanAnalyze returns false when at limit', () => {
      useAppStore.setState({ analysesUsedToday: FREE_ANALYSIS_LIMIT, isPremium: false });
      expect(selectCanAnalyze(useAppStore.getState())).toBe(false);
    });

    it('selectCanAnalyze returns true for premium users regardless of count', () => {
      useAppStore.setState({ analysesUsedToday: 100, isPremium: true });
      expect(selectCanAnalyze(useAppStore.getState())).toBe(true);
    });

    it('selectRemainingAnalyses calculates correctly', () => {
      useAppStore.setState({ analysesUsedToday: 1, isPremium: false });
      expect(selectRemainingAnalyses(useAppStore.getState())).toBe(FREE_ANALYSIS_LIMIT - 1);
    });

    it('selectRemainingAnalyses returns Infinity for premium', () => {
      useAppStore.setState({ isPremium: true });
      expect(selectRemainingAnalyses(useAppStore.getState())).toBe(Infinity);
    });
  });

  describe('AI consent', () => {
    it('should set AI consent', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setHasGivenAIConsent(true);
      });

      expect(result.current.hasGivenAIConsent).toBe(true);
      expect(result.current.preferences.aiConsentGiven).toBe(true);
      expect(result.current.preferences.aiConsentDate).toBeDefined();
    });
  });

  describe('analysis history', () => {
    it('should add analysis to history', () => {
      const { result } = renderHook(() => useAppStore());
      const mockAnalysis = {
        id: 'test-1',
        userId: 'user-1',
        videoUrl: 'http://example.com/video.mp4',
        overallScore: 75,
        stance: 'orthodox' as const,
        techniqueScores: [],
        rootCauses: [],
        summary: 'Test summary',
        topStrengths: [],
        priorityImprovements: [],
        recommendedDrills: [],
        createdAt: new Date().toISOString(),
        analyzedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addAnalysisToHistory(mockAnalysis);
      });

      expect(result.current.analysisHistory).toHaveLength(1);
      expect(result.current.analysisHistory[0]).toEqual(mockAnalysis);
    });

    it('should limit history to 50 items', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.addAnalysisToHistory({
            id: `test-${i}`,
            userId: 'user-1',
            videoUrl: 'http://example.com/video.mp4',
            overallScore: 75,
            stance: 'orthodox' as const,
            techniqueScores: [],
            rootCauses: [],
            summary: 'Test summary',
            topStrengths: [],
            priorityImprovements: [],
            recommendedDrills: [],
            createdAt: new Date().toISOString(),
            analyzedAt: new Date().toISOString(),
          });
        }
      });

      expect(result.current.analysisHistory).toHaveLength(50);
    });
  });
});
