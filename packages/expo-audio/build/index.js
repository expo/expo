import { EventEmitter } from 'expo-modules-core';
import { useMemo, useEffect, useState } from 'react';
import AudioModule from './AudioModule';
import { resolveSource } from './utils/resolveSource';
const audioModuleEmitter = new EventEmitter(AudioModule);
export function useAudioPlayer(source = null, statusListener) {
    const player = useMemo(() => new AudioModule.AudioPlayer(resolveSource(source)), [source]);
    useEffect(() => {
        const subscription = addStatusUpdateListener((status) => {
            if (status.id === player.id) {
                statusListener?.(status);
            }
        });
        return () => subscription.remove();
    }, [player.id]);
    return player;
}
export function useAudioRecorder(options, statusListener) {
    const recorder = useMemo(() => new AudioModule.AudioRecorder(options), []);
    const [state, setState] = useState(recorder.getStatus());
    useEffect(() => {
        const subscription = addRecordingStatusListener((status) => {
            if (status.id === recorder.id) {
                statusListener?.(status);
            }
        });
        return () => subscription.remove();
    }, [recorder.id]);
    useEffect(() => {
        const interval = setInterval(() => {
            setState(recorder.getStatus());
        }, 1000);
        return () => clearInterval(interval);
    }, [recorder.id]);
    return [recorder, state];
}
export function addStatusUpdateListener(listener) {
    return audioModuleEmitter.addListener('onPlaybackStatusUpdate', listener);
}
export function addRecordingStatusListener(listener) {
    return audioModuleEmitter.addListener('onRecordingStatusUpdate', listener);
}
export async function setIsAudioActiveAsync(active) {
    return await AudioModule.setIsAudioActiveAsync(active);
}
export async function setAudioModeAsync(mode) {
    return await AudioModule.setAudioModeAsync(mode);
}
export { AudioModule };
export * from './Audio.types';
//# sourceMappingURL=index.js.map