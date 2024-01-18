import { EventEmitter, Subscription } from 'expo-modules-core';
import { useMemo, useEffect } from 'react';

import { AudioSource } from './Audio.types';
import AudioModule from './AudioModule';
import {
  AudioCategory,
  AudioPlayer,
  AudioRecorder,
  AudioStatus,
  RecordingStatus,
} from './AudioModule.types';
import RecordingModule from './RecordingModule';
import { resolveSource } from './utils/resolveSource';

const audioEmitter = new EventEmitter(AudioModule);
const recordingEmitter = new EventEmitter(RecordingModule);

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

export function useAudioRecorder(url: string | null = null): AudioRecorder {
  return useMemo(() => new RecordingModule.AudioRecorder(url), [url]);
}

export function addStatusUpdateListener(listener: (event: AudioStatus) => void): Subscription {
  return audioEmitter.addListener<AudioStatus>('onPlaybackStatusUpdate', listener);
}

export function addRecordingStatusListener(
  listener: (event: RecordingStatus) => void
): Subscription {
  return recordingEmitter.addListener<RecordingStatus>('onRecordingStatusUpdate', listener);
}

export function setIsAudioActive(enabled: boolean) {
  AudioModule.setIsAudioActive(enabled);
}

export function setAudioCategory(category: AudioCategory) {
  AudioModule.setCategory(category);
}

export { AudioStatus as ChangeEventPayload, AudioSource };
