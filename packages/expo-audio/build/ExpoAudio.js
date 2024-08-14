import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';
export function useAudioPlayer(source = null, updateInterval = 500) {
    const parsedSource = resolveSource(source);
    const player = useReleasingSharedObject(() => new AudioModule.AudioPlayer(parsedSource, updateInterval), [JSON.stringify(parsedSource)]);
    return player;
}
export function useAudioPlayerStatus(player) {
    const currentStatus = useMemo(() => player.currentStatus, [player.id]);
    return useEvent(player, 'onPlaybackStatusUpdate', currentStatus);
}
export function useAudioSampleListener(player, listener) {
    player.setAudioSamplingEnabled(true);
    useEffect(() => {
        if (!player.isAudioSamplingSupported) {
            return;
        }
        const subscription = player.addListener('onAudioSampleUpdate', listener);
        return () => {
            player.setAudioSamplingEnabled(false);
            subscription.remove();
        };
    }, [player.id]);
}
export function useAudioRecorder(options, statusListener, updateInterval = 500) {
    const platformOptions = createRecordingOptions(options);
    const recorder = useReleasingSharedObject(() => {
        return new AudioModule.AudioRecorder(platformOptions);
    }, [JSON.stringify(platformOptions)]);
    const [state, setState] = useState(recorder.getStatus());
    useEffect(() => {
        const subscription = recorder.addListener('onRecordingStatusUpdate', (status) => {
            console.log(status);
            statusListener?.(status);
        });
        return () => subscription.remove();
    }, [recorder.id]);
    useEffect(() => {
        const interval = setInterval(() => {
            const status = recorder.getStatus();
            setState(status);
        }, updateInterval);
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
//# sourceMappingURL=ExpoAudio.js.map