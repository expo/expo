import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';

import {
  AudioMode,
  AudioSource,
  AudioStatus,
  RecorderState,
  RecordingOptions,
  RecordingStatus,
} from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';

// Add a new type for metadata
type AudioMetadata = {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
};

// Update the useAudioPlayer hook to accept metadata
export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  updateInterval: number = 500,
  enableLockScreenControls: boolean = false,
  metadata?: AudioMetadata
): AudioPlayer {
  const parsedSource = resolveSource(source);
  const player = useReleasingSharedObject(
    () =>
      new AudioModule.AudioPlayer(parsedSource, updateInterval, enableLockScreenControls, metadata),
    [JSON.stringify(parsedSource), enableLockScreenControls, JSON.stringify(metadata)]
  );

  return player;
}

// Add a method to update metadata
export function updateAudioPlayerMetadata(player: AudioPlayer, metadata: AudioMetadata): void {
  player.updateMetadata(metadata);
}

export function useAudioPlayerStatus(player: AudioPlayer): AudioStatus {
  const currentStatus = useMemo(() => player.currentStatus, [player.id]);
  return useEvent(player, 'onPlaybackStatusUpdate', currentStatus);
}

export function useAudioSampleListener(
  player: AudioPlayer,
  listener: (data: { channels: { frames: number[] }[]; timestamp: number }) => void
) {
  player.setAudioSamplingEnabled(true);
  useEffect(() => {
    if (!player.isAudioSamplingSupported) {
      return;
    }
    const subscription = player.addListener('onAudioSampleUpdate', listener);
    return () => {
      subscription.remove();
    };
  }, [player.id]);
}

export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (status: RecordingStatus) => void
): AudioRecorder {
  const platformOptions = createRecordingOptions(options);
  const recorder = useReleasingSharedObject(() => {
    return new AudioModule.AudioRecorder(platformOptions);
  }, [JSON.stringify(platformOptions)]);

  useEffect(() => {
    const subscription = recorder.addListener('onRecordingStatusUpdate', (status) => {
      statusListener?.(status);
    });
    return () => subscription.remove();
  }, [recorder.id]);

  return recorder;
}

export function useAudioRecorderState(recorder: AudioRecorder, interval: number = 500) {
  const [state, setState] = useState<RecorderState>(recorder.getStatus());

  useEffect(() => {
    const int = setInterval(() => {
      setState(recorder.getStatus());
    }, interval);

    return () => clearInterval(int);
  }, [recorder.id]);

  return state;
}

export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

export async function setAudioModeAsync(mode: Partial<AudioMode>): Promise<void> {
  return await AudioModule.setAudioModeAsync(mode);
}

export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
export * from './RecordingConstants';
