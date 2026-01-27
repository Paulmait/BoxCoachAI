// Video Sync Hook for Comparison View
import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, AVPlaybackStatusSuccess } from 'expo-av';

interface VideoSyncState {
  isPlaying: boolean;
  position: number;
  duration: number;
  isMuted: boolean;
}

interface UseVideoSyncReturn {
  state: VideoSyncState;
  video1Ref: React.RefObject<Video>;
  video2Ref: React.RefObject<Video>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  toggleMute: () => Promise<void>;
  restart: () => Promise<void>;
}

export function useVideoSync(): UseVideoSyncReturn {
  const video1Ref = useRef<Video>(null);
  const video2Ref = useRef<Video>(null);

  const [state, setState] = useState<VideoSyncState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    isMuted: false,
  });

  // Play both videos
  const play = useCallback(async () => {
    try {
      await Promise.all([video1Ref.current?.playAsync(), video2Ref.current?.playAsync()]);
      setState((prev) => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Error playing videos:', error);
    }
  }, []);

  // Pause both videos
  const pause = useCallback(async () => {
    try {
      await Promise.all([video1Ref.current?.pauseAsync(), video2Ref.current?.pauseAsync()]);
      setState((prev) => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Error pausing videos:', error);
    }
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  // Seek both videos to a position
  const seek = useCallback(async (position: number) => {
    try {
      await Promise.all([
        video1Ref.current?.setPositionAsync(position),
        video2Ref.current?.setPositionAsync(position),
      ]);
      setState((prev) => ({ ...prev, position }));
    } catch (error) {
      console.error('Error seeking videos:', error);
    }
  }, []);

  // Toggle mute on both videos
  const toggleMute = useCallback(async () => {
    const newMuteState = !state.isMuted;
    try {
      await Promise.all([
        video1Ref.current?.setIsMutedAsync(newMuteState),
        video2Ref.current?.setIsMutedAsync(newMuteState),
      ]);
      setState((prev) => ({ ...prev, isMuted: newMuteState }));
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, [state.isMuted]);

  // Restart both videos
  const restart = useCallback(async () => {
    await seek(0);
    await play();
  }, [seek, play]);

  // Sync videos periodically when playing
  useEffect(() => {
    let syncInterval: NodeJS.Timeout | null = null;

    if (state.isPlaying) {
      syncInterval = setInterval(async () => {
        try {
          const status1 = await video1Ref.current?.getStatusAsync();
          const status2 = await video2Ref.current?.getStatusAsync();

          if (
            status1?.isLoaded &&
            status2?.isLoaded &&
            (status1 as AVPlaybackStatusSuccess).isPlaying &&
            (status2 as AVPlaybackStatusSuccess).isPlaying
          ) {
            const pos1 = (status1 as AVPlaybackStatusSuccess).positionMillis;
            const pos2 = (status2 as AVPlaybackStatusSuccess).positionMillis;

            // If videos are more than 100ms apart, sync them
            if (Math.abs(pos1 - pos2) > 100) {
              await video2Ref.current?.setPositionAsync(pos1);
            }
          }
        } catch (error) {
          // Ignore sync errors
        }
      }, 500);
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [state.isPlaying]);

  return {
    state,
    video1Ref,
    video2Ref,
    play,
    pause,
    togglePlayPause,
    seek,
    toggleMute,
    restart,
  };
}

// Format milliseconds to mm:ss
export function formatVideoTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
