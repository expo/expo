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
import { resolveSource } from './utils/resolveSource';

export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  statusListener?: (status: AudioStatus) => void
): AudioPlayer {
  const parsedSource = resolveSource(source);
  const player = useReleasingSharedObject(() => {
    return new AudioModule.AudioPlayer(parsedSource);
  }, [JSON.stringify(parsedSource)]);

  useEffect(() => {
    const subscription = player.addListener('onPlaybackStatusUpdate', (status) => {
      statusListener?.(status);
    });
    return () => subscription.remove();
  }, [player.id]);

  return player;
}

export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (status: RecordingStatus) => void
): [AudioRecorder, RecorderState] {
  const recorder = useReleasingSharedObject(() => {
    return new AudioModule.AudioRecorder(options);
  }, [JSON.stringify(options)]);
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
