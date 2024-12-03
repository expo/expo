import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';
import AudioModule from './AudioModule';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';
export const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate';
export const AUDIO_SAMPLE_UPDATE = 'audioSampleUpdate';
export const RECORDING_STATUS_UPDATE = 'recordingStatusUpdate';
export function useAudioPlayer(source = null, updateInterval = 500) {
    const parsedSource = resolveSource(source);
    return useReleasingSharedObject(() => new AudioModule.AudioPlayer(parsedSource, updateInterval), [JSON.stringify(parsedSource)]);
}
export function useAudioPlayerStatus(player) {
    const currentStatus = useMemo(() => player.currentStatus, [player.id]);
    return useEvent(player, PLAYBACK_STATUS_UPDATE, currentStatus);
}
export function useAudioSampleListener(player, listener) {
    player.setAudioSamplingEnabled(true);
    useEffect(() => {
        if (!player.isAudioSamplingSupported) {
            return;
        }
        const subscription = player.addListener(AUDIO_SAMPLE_UPDATE, listener);
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
        const subscription = recorder.addListener(RECORDING_STATUS_UPDATE, (status) => {
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
/**
 * Creates an instance of an `AudioPlayer` that doesn't release automatically.
 *
 * > **info** For most use cases you should use the [`useAudioPlayer`](#useaudioplayersource-updateinterval) hook instead. See the [Using the `AudioPlayer` directly](#using-the-audioplayer-directly) section for more details.
 * @param source
 */
export function createAudioPlayer(source = null, updateInterval = 500) {
    const parsedSource = resolveSource(source);
    return new AudioModule.AudioPlayer(parsedSource, updateInterval);
}
export async function setIsAudioActiveAsync(active) {
    return await AudioModule.setIsAudioActiveAsync(active);
}
export async function setAudioModeAsync(mode) {
    return await AudioModule.setAudioModeAsync(mode);
}
export async function requestRecordingPermissionsAsync() {
    return await AudioModule.requestRecordingPermissionsAsync();
}
export async function getRecordingPermissionsAsync() {
    return await AudioModule.getRecordingPermissionsAsync();
}
export { AudioModule };
//# sourceMappingURL=ExpoAudio.js.map