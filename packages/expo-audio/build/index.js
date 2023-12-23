import { EventEmitter } from 'expo-modules-core';
import { useRef } from 'react';
import AudioModule from './AudioModule';
const emitter = new EventEmitter(AudioModule);
export function useAudioPlayer(source = null) {
    return useRef(new AudioModule.AudioPlayer(source)).current;
}
export function addChangeListener(listener) {
    return emitter.addListener('onChange', listener);
}
//# sourceMappingURL=index.js.map