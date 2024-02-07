import { EventEmitter } from 'expo-modules-core';
import { useMemo, useEffect } from 'react';
import AudioModule from './AudioModule';
import RecordingModule from './RecordingModule';
import { resolveSource } from './utils/resolveSource';
const audioEmitter = new EventEmitter(AudioModule);
const recordingEmitter = new EventEmitter(RecordingModule);
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
export function useAudioRecorder(url = null) {
    return useMemo(() => new RecordingModule.AudioRecorder(url), [url]);
}
export function addStatusUpdateListener(listener) {
    return audioEmitter.addListener('onPlaybackStatusUpdate', listener);
}
export function addRecordingStatusListener(listener) {
    return recordingEmitter.addListener('onRecordingStatusUpdate', listener);
}
export async function setIsAudioActiveAsync(active) {
    return await AudioModule.setIsAudioActiveAsync(active);
}
export async function setAudioCategoryAsync(category) {
    return await AudioModule.setCategoryAsync(category);
}
//# sourceMappingURL=index.js.map