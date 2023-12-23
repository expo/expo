import { EventEmitter, Subscription } from 'expo-modules-core';
import { useRef } from 'react';

import AudioModule from './AudioModule';
import { AudioPlayer, ChangeEventPayload } from './AudioModule.types';

const emitter = new EventEmitter(AudioModule);

export function useAudioPlayer(source: string | null = null): AudioPlayer {
  return useRef(new AudioModule.AudioPlayer(source)).current;
}

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { ChangeEventPayload };
