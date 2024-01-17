import { EventEmitter } from 'expo-modules-core';
import { useMemo, useEffect } from 'react';
import AudioModule from './AudioModule';
import { resolveSource } from './utils/resolveSource';
const emitter = new EventEmitter(AudioModule);
export function useAudioPlayer(source = null, statusListener) {
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
export function addStatusUpdateListener(listener) {
    return emitter.addListener('onPlaybackStatusUpdate', listener);
}
export function setIsAudioActive(enabled) {
    AudioModule.setIsAudioActive(enabled);
}
export function setAudioCategory(category) {
    AudioModule.setCategory(category);
}
//# sourceMappingURL=index.js.map