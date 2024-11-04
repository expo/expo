import { useEvent } from 'expo';
import { useEffect, useState, useMemo } from 'react';
import * as AudioModule from './AudioModule.web';
import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE } from './ExpoAudio';
import { createRecordingOptions } from './utils/options';
import { resolveSource } from './utils/resolveSource';
export function useAudioPlayer(source = null, updateInterval = 500) {
    const parsedSource = resolveSource(source);
    const player = useMemo(() => new AudioModule.AudioPlayerWeb(parsedSource, updateInterval), [JSON.stringify(parsedSource)]);
    useEffect(() => {
        return () => player.remove();
    }, []);
    return player;
}
export function useAudioPlayerStatus(player) {
    const currentStatus = useMemo(() => player.currentStatus, [player.id]);
    return useEvent(player, PLAYBACK_STATUS_UPDATE, currentStatus);
}
export function useAudioSampleListener(player, listener) {
    player.setAudioSamplingEnabled(true);
    useEffect(() => {
        const subscription = player.addListener(AUDIO_SAMPLE_UPDATE, listener);
        return () => {
            player.setAudioSamplingEnabled(false);
            subscription.remove();
        };
    }, [player.id]);
}
export function useAudioRecorder(options, statusListener) {
    const platformOptions = createRecordingOptions(options);
    const recorder = useMemo(() => {
        return new AudioModule.AudioRecorderWeb(platformOptions);
    }, [JSON.stringify(platformOptions)]);
    useEffect(() => {
        const subscription = recorder.addListener(RECORDING_STATUS_UPDATE, (status) => {
            statusListener?.(status);
        });
        return () => {
            recorder.clearTimeouts();
            subscription.remove();
        };
    }, [recorder.id]);
    return recorder;
}
export function useAudioRecorderState(recorder, interval = 500) {
    const [state, setState] = useState(recorder.getStatus());
    useEffect(() => {
        const id = setInterval(() => {
            setState(recorder.getStatus());
        }, interval);
        return () => clearInterval(id);
    }, [recorder.id]);
    return state;
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
//# sourceMappingURL=ExpoAudio.web.js.map