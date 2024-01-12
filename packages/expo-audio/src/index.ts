import { EventEmitter, Subscription } from 'expo-modules-core';
import { useRef } from 'react';

import { AudioSource } from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, StatusEvent } from './AudioModule.types';
import { resolveSource } from './utils/resolveSource';

const emitter = new EventEmitter(AudioModule);

export function useAudioPlayer(source: AudioSource | string | number | null = null): AudioPlayer {
  return useRef(new AudioModule.AudioPlayer(resolveSource(source))).current;
}

export function addStatusUpdateListener(listener: (event: StatusEvent) => void): Subscription {
  return emitter.addListener<StatusEvent>('onPlaybackStatusUpdate', listener);
}

export function setIsAudioActive(enabled: boolean) {
  AudioModule.setIsAudioActive(enabled);
}

export { StatusEvent as ChangeEventPayload, AudioSource };
