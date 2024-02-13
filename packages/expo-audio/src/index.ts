import { EventEmitter, Subscription } from 'expo-modules-core';
import { useMemo, useEffect, useState } from 'react';

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

const audioModuleEmitter = new EventEmitter(AudioModule);

export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  statusListener?: (status: AudioStatus) => void
): AudioPlayer {
  const player = useMemo(() => new AudioModule.AudioPlayer(resolveSource(source)), [source]);

  useEffect(() => {
    const subscription = addStatusUpdateListener((status) => {
      if (status.id === player.id) {
        console.log(status);
        statusListener?.(status);
      }
    });
    return () => subscription.remove();
  }, [player.id]);

  return player;
}

export function useAudioRecorder(
  options: RecordingOptions,
  statusListener?: (status: RecordingStatus) => void
): AudioRecorder {
  const recorder = useMemo(() => new AudioModule.AudioRecorder(options), []);
  const [state, setState] = useState<RecorderState>(recorder.getStatus());

  useEffect(() => {
    const subscription = addRecordingStatusListener((status) => {
      if (status.id === recorder.id) {
        console.log({ status, state });
        statusListener?.(status);
      }
    });
    return () => subscription.remove();
  }, [recorder.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (recorder.isRecording) {
        setState(recorder.getStatus());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [recorder.id]);

  return recorder;
}

export function addStatusUpdateListener(listener: (event: AudioStatus) => void): Subscription {
  return audioModuleEmitter.addListener<AudioStatus>('onPlaybackStatusUpdate', listener);
}

export function addRecordingStatusListener(
  listener: (event: RecordingStatus) => void
): Subscription {
  return audioModuleEmitter.addListener<RecordingStatus>('onRecordingStatusUpdate', listener);
}

export async function setIsAudioActiveAsync(active: boolean): Promise<void> {
  return await AudioModule.setIsAudioActiveAsync(active);
}

export async function setAudioModeAsync(mode: AudioMode): Promise<void> {
  return await AudioModule.setAudioModeAsync(mode);
}

export { AudioStatus as ChangeEventPayload, AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
