import { EventEmitter } from 'expo-modules-core';
import { useRef } from 'react';
import AudioModule from './AudioModule';
import { resolveSource } from './utils/resolveSource';
const emitter = new EventEmitter(AudioModule);
export function useAudioPlayer(source = null) {
    return useRef(new AudioModule.AudioPlayer(resolveSource(source))).current;
}
export function addStatusUpdateListener(listener) {
    return emitter.addListener('onPlaybackStatusUpdate', listener);
}
export function setIsAudioActive(enabled) {
    AudioModule.setIsAudioActive(enabled);
}
//# sourceMappingURL=index.js.map