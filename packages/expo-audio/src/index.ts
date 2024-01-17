import { EventEmitter, Subscription } from 'expo-modules-core';
import { useMemo, useEffect } from 'react';

import { AudioSource } from './Audio.types';
import AudioModule from './AudioModule';
import { AudioCategory, AudioPlayer, StatusEvent } from './AudioModule.types';
import { resolveSource } from './utils/resolveSource';

const emitter = new EventEmitter(AudioModule);

export function useAudioPlayer(
  source: AudioSource | string | number | null = null,
  statusListener?: (status: StatusEvent) => void
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

export function addStatusUpdateListener(listener: (event: StatusEvent) => void): Subscription {
  return emitter.addListener<StatusEvent>('onPlaybackStatusUpdate', listener);
}

export function setIsAudioActive(enabled: boolean) {
  AudioModule.setIsAudioActive(enabled);
}

export function setAudioCategory(category: AudioCategory) {
  AudioModule.setCategory(category);
}

export { StatusEvent as ChangeEventPayload, AudioSource };
