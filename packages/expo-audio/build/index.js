import { EventEmitter } from 'expo-modules-core';
import { useMemo, useEffect, useState } from 'react';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import { resolveSource } from './utils/resolveSource';
const audioModuleEmitter = new EventEmitter(AudioModule);
export function useAudioPlayer(source = null, statusListener) {
    const player = useMemo(() => new AudioModule.AudioPlayer(resolveSource(source)), [source]);
    useEffect(() => {
        const subscription = player.addListener('onPlaybackStatusUpdate', (status) => {
            statusListener?.(status);
        });
        return () => subscription.remove();
    }, []);
    return player;
}
export function useAudioRecorder(options, statusListener) {
    const recorder = useMemo(() => new AudioModule.AudioRecorder(options), []);
    const [state, setState] = useState(recorder.getStatus());
    useEffect(() => {
        const subscription = recorder.addListener('onRecordingStatusUpdate', (state) => {
            statusListener?.(state);
        });
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
export function addStatusUpdateListener(listener) {
    return audioModuleEmitter.addListener('onPlaybackStatusUpdate', listener);
}
export async function setIsAudioActiveAsync(active) {
    return await AudioModule.setIsAudioActiveAsync(active);
}
export async function setAudioModeAsync(mode) {
    return await AudioModule.setAudioModeAsync(mode);
}
export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
//# sourceMappingURL=index.js.map