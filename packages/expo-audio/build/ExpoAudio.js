import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';
// Update the useAudioPlayer hook to accept metadata
export function useAudioPlayer(source = null, updateInterval = 500, enableLockScreenControls = false, metadata) {
    const parsedSource = resolveSource(source);
    const player = useReleasingSharedObject(() => new AudioModule.AudioPlayer(parsedSource, updateInterval, enableLockScreenControls, metadata), [JSON.stringify(parsedSource), enableLockScreenControls, JSON.stringify(metadata)]);
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
            subscription.remove();
        };
    }, [player.id]);
}
export function useAudioRecorder(options, statusListener) {
    const platformOptions = createRecordingOptions(options);
    const recorder = useReleasingSharedObject(() => {
        return new AudioModule.AudioRecorder(platformOptions);
    }, [JSON.stringify(platformOptions)]);
    useEffect(() => {
        const subscription = recorder.addListener('onRecordingStatusUpdate', (status) => {
            statusListener?.(status);
        });
        return () => subscription.remove();
    }, [recorder.id]);
    return recorder;
}
export function useAudioRecorderState(recorder, interval = 500) {
    const [state, setState] = useState(recorder.getStatus());
    useEffect(() => {
        const int = setInterval(() => {
            setState(recorder.getStatus());
        }, interval);
        return () => clearInterval(int);
    }, [recorder.id]);
    return state;
}
export async function setIsAudioActiveAsync(active) {
    return await AudioModule.setIsAudioActiveAsync(active);
}
export async function setAudioModeAsync(mode) {
    return await AudioModule.setAudioModeAsync(mode);
}
export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
export * from './RecordingConstants';
//# sourceMappingURL=ExpoAudio.js.map