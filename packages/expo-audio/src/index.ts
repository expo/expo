import { EventEmitter, Subscription } from 'expo-modules-core';
import { useMemo, useEffect, useState } from 'react';

import {
  AudioMode,
  AudioSource,
  AudioStatus,
  RecorderStatus,
  RecordingOptions,
  RecordingState,
} from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import { resolveSource } from './utils/resolveSource';

const audioModuleEmitter = new EventEmitter(AudioModule);

export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  statusListener?: (status: AudioStatus) => void
): AudioPlayer {
  const player = useMemo(() => new AudioModule.AudioPlayer(resolveSource(source)), [source]);

  useEffect(() => {
    const subscription = player.addListener('onPlaybackStatusUpdate', (status: AudioStatus) => {
      statusListener?.(status);
    });
    return () => subscription.remove();
  }, []);

  return player;
}

export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (state: RecordingState) => void
): [AudioRecorder, RecorderStatus] {
  const recorder = useMemo(() => new AudioModule.AudioRecorder(options), []);
  const [state, setState] = useState<RecorderStatus>(recorder.getStatus());

  useEffect(() => {
    const subscription = recorder.addListener(
      'onRecordingStatusUpdate',
      (state: RecordingState) => {
        statusListener?.(state);
      }
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(recorder.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return [recorder, state];
}

export function addStatusUpdateListener(listener: (event: AudioStatus) => void): Subscription {
  return audioModuleEmitter.addListener<AudioStatus>('onPlaybackStatusUpdate', listener);
}

export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

export async function setAudioModeAsync(mode: AudioMode): Promise<void> {
  return await AudioModule.setAudioModeAsync(mode);
}

export { AudioStatus as ChangeEventPayload, AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
