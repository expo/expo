import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';
import { Platform } from 'react-native';
import AudioModule from './AudioModule';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';
export const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate';
export const AUDIO_SAMPLE_UPDATE = 'audioSampleUpdate';
export const RECORDING_STATUS_UPDATE = 'recordingStatusUpdate';
// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const replace = AudioModule.AudioPlayer.prototype.replace;
AudioModule.AudioPlayer.prototype.replace = function (source) {
    return replace.call(this, resolveSource(source));
};
const prepareToRecordAsync = AudioModule.AudioRecorder.prototype.prepareToRecordAsync;
AudioModule.AudioRecorder.prototype.prepareToRecordAsync = function (options) {
    const processedOptions = options ? createRecordingOptions(options) : undefined;
    return prepareToRecordAsync.call(this, processedOptions);
};
// @docsMissing
export function useAudioPlayer(source = null, updateInterval = 500) {
    const parsedSource = resolveSource(source);
    return useReleasingSharedObject(() => new AudioModule.AudioPlayer(parsedSource, updateInterval), [JSON.stringify(parsedSource)]);
}
// @docsMissing
export function useAudioPlayerStatus(player) {
    const currentStatus = useMemo(() => player.currentStatus, [player.id]);
    return useEvent(player, PLAYBACK_STATUS_UPDATE, currentStatus);
}
// @docsMissing
export function useAudioSampleListener(player, listener) {
    useEffect(() => {
        if (!player.isAudioSamplingSupported) {
            return;
        }
        player.setAudioSamplingEnabled(true);
        const subscription = player.addListener(AUDIO_SAMPLE_UPDATE, listener);
        return () => subscription.remove();
    }, [player.id]);
}
// @docsMissing
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
// @docsMissing
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
 * > **info** For most use cases you should use the [`useAudioPlayer`](#useaudioplayersource-updateinterval) hook instead.
 * > See the [Using the `AudioPlayer` directly](#using-the-audioplayer-directly) section for more details.
 * @param source
 * @param updateInterval
 */
export function createAudioPlayer(source = null, updateInterval = 500) {
    const parsedSource = resolveSource(source);
    return new AudioModule.AudioPlayer(parsedSource, updateInterval);
}
// @docsMissing
export async function setIsAudioActiveAsync(active) {
    return await AudioModule.setIsAudioActiveAsync(active);
}
// @docsMissing
export async function setAudioModeAsync(mode) {
    const audioMode = Platform.OS === 'ios'
        ? mode
        : {
            shouldPlayInBackground: mode.shouldPlayInBackground,
            shouldRouteThroughEarpiece: mode.shouldRouteThroughEarpiece,
            interruptionMode: mode.interruptionModeAndroid,
        };
    return await AudioModule.setAudioModeAsync(audioMode);
}
// @docsMissing
export async function requestRecordingPermissionsAsync() {
    return await AudioModule.requestRecordingPermissionsAsync();
}
// @docsMissing
export async function getRecordingPermissionsAsync() {
    return await AudioModule.getRecordingPermissionsAsync();
}
export { AudioModule };
//# sourceMappingURL=ExpoAudio.js.map