import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState } from 'react';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import { resolveSource } from './utils/resolveSource';
export function useAudioPlayer(source = null, statusListener) {
    const parsedSource = resolveSource(source);
    const player = useReleasingSharedObject(() => {
        return new AudioModule.AudioPlayer(parsedSource);
    }, [JSON.stringify(parsedSource)]);
    useEffect(() => {
        const subscription = player.addListener('onPlaybackStatusUpdate', (status) => {
            statusListener?.(status);
        });
        return () => subscription.remove();
    }, [player.id]);
    return player;
}
export function useAudioRecorder(options, statusListener) {
    const recorder = useReleasingSharedObject(() => {
        return new AudioModule.AudioRecorder(options);
    }, [options]);
    const [state, setState] = useState(recorder.getStatus());
    useEffect(() => {
        const subscription = recorder.addListener('onRecordingStatusUpdate', (status) => {
            statusListener?.(status);
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
export async function setIsAudioActiveAsync(active) {
    return await AudioModule.setIsAudioActiveAsync(active);
}
export async function setAudioModeAsync(mode) {
    return await AudioModule.setAudioModeAsync(mode);
}
export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
//# sourceMappingURL=index.js.map