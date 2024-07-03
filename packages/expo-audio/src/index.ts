import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState } from 'react';

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

export function useAudioPlayer(
  source: AudioSource | string | number | null = null
): readonly [AudioPlayer, AudioStatus] {
  const parsedSource = resolveSource(source);
  const player = useReleasingSharedObject(() => {
    return new AudioModule.AudioPlayer(parsedSource);
  }, [JSON.stringify(parsedSource)]);

  const status = useEvent(player, 'onPlaybackStatusUpdate', {
    id: player.id,
    currentTime: player.currentTime,
    status: 'unknown',
    timeControlStatus: 'unknown',
    reasonForWaitingToPlay: 'unknown',
    mute: player.muted,
    duration: player.duration,
    playing: player.playing,
    loop: player.loop,
    isBuffering: player.isBuffering,
    isLoaded: player.isLoaded,
    playbackRate: player.playbackRate,
    shouldCorrectPitch: player.shouldCorrectPitch,
  });

  return [player, status] as const;
}

export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (status: RecordingStatus) => void
): [AudioRecorder, RecorderState] {
  const platformOptions = createRecordingOptions(options);
  const recorder = useReleasingSharedObject(() => {
    return new AudioModule.AudioRecorder(platformOptions);
  }, [JSON.stringify(platformOptions)]);

  const [state, setState] = useState<RecorderState>(recorder.getStatus());

  useEffect(() => {
    const subscription = recorder.addListener('onRecordingStatusUpdate', (status) => {
      statusListener?.(status);
    });
    return () => subscription.remove();
  }, [recorder.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = recorder.getStatus();
      setState(status);
    }, 1000);

    return () => clearInterval(interval);
  }, [recorder.id]);

  return [recorder, state];
}

export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

export async function setAudioModeAsync(mode: AudioMode): Promise<void> {
  return await AudioModule.setAudioModeAsync(mode);
}

export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
