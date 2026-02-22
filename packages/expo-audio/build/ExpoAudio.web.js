import { useEvent } from 'expo';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect, useState, useMemo } from 'react';
import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE, PLAYLIST_STATUS_UPDATE, RECORDING_STATUS_UPDATE, } from './AudioEventKeys';
import * as AudioModule from './AudioModule.web';
import { createRecordingOptions } from './utils/options';
import { resolveSource, resolveSources } from './utils/resolveSource';
export function createAudioPlayer(source = null, options = {}) {
    const { downloadFirst = false } = options;
    // If downloadFirst is true, we don't need to resolve the source, because it will be replaced once the source is downloaded.
    // If downloadFirst is false, we resolve the source here.
    const initialSource = downloadFirst ? null : resolveSource(source);
    const player = new AudioModule.AudioPlayerWeb(initialSource, options);
    // Preload the source and replace the player's source with the cached blob URL.
    // Only relevant if downloadFirst is true and source is not null.
    if (downloadFirst && source) {
        const resolved = resolveSource(source);
        if (resolved) {
            AudioModule.preloadAsync(resolved).finally(() => {
                player.replace(resolved);
            });
        }
    }
    return player;
}
export function useAudioPlayer(source = null, options = {}) {
    const { downloadFirst = false } = options;
    // If downloadFirst is true, we don't need to resolve the source, because it will be resolved in the useEffect below.
    // If downloadFirst is false, we resolve the source here.
    // we call .replace() in the useEffect below to replace the source with the downloaded one.
    const initialSource = useMemo(() => {
        return downloadFirst ? null : resolveSource(source);
    }, [JSON.stringify(source), downloadFirst]);
    const player = useReleasingSharedObject(() => new AudioModule.AudioPlayerWeb(initialSource, options), [JSON.stringify(initialSource), JSON.stringify(options)]);
    // Handle async source resolution for downloadFirst
    useEffect(() => {
        if (!downloadFirst || source === null) {
            return;
        }
        let isCancelled = false;
        const resolved = resolveSource(source);
        if (resolved) {
            AudioModule.preloadAsync(resolved).finally(() => {
                if (!isCancelled) {
                    player.replace(resolved);
                }
            });
        }
        return () => {
            isCancelled = true;
        };
    }, [player, JSON.stringify(source), downloadFirst]);
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
        const int = setInterval(() => {
            const newState = recorder.getStatus();
            setState((prevState) => {
                const meteringChanged = (prevState.metering === undefined) !== (newState.metering === undefined) ||
                    (prevState.metering !== undefined &&
                        newState.metering !== undefined &&
                        Math.abs(prevState.metering - newState.metering) > 0.1);
                if (prevState.canRecord !== newState.canRecord ||
                    prevState.isRecording !== newState.isRecording ||
                    prevState.mediaServicesDidReset !== newState.mediaServicesDidReset ||
                    prevState.url !== newState.url ||
                    Math.abs(prevState.durationMillis - newState.durationMillis) > 50 ||
                    meteringChanged) {
                    return newState;
                }
                return prevState;
            });
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
export async function requestRecordingPermissionsAsync() {
    return await AudioModule.requestRecordingPermissionsAsync();
}
export async function getRecordingPermissionsAsync() {
    return await AudioModule.getRecordingPermissionsAsync();
}
export function useAudioPlaylist(options = {}) {
    const { sources = [], updateInterval = 500, loop = 'none', crossOrigin } = options;
    const resolvedSources = useMemo(() => resolveSources(sources), [JSON.stringify(sources)]);
    const playlist = useMemo(() => new AudioModule.AudioPlaylistWeb(resolvedSources, updateInterval, loop, crossOrigin), [JSON.stringify(resolvedSources), updateInterval, loop, crossOrigin]);
    useEffect(() => {
        return () => playlist.destroy();
    }, [playlist]);
    return playlist;
}
export function useAudioPlaylistStatus(playlist) {
    const currentStatus = useMemo(() => playlist.currentStatus, [playlist.id]);
    return useEvent(playlist, PLAYLIST_STATUS_UPDATE, currentStatus);
}
export function createAudioPlaylist(options = {}) {
    const { sources = [], updateInterval = 500, loop = 'none', crossOrigin } = options;
    const resolvedSources = resolveSources(sources);
    return new AudioModule.AudioPlaylistWeb(resolvedSources, updateInterval, loop, crossOrigin);
}
export function preload(source, _options = {}) {
    const resolved = resolveSource(source);
    if (!resolved)
        return;
    AudioModule.preload(resolved);
}
export function clearPreloadedSource(source) {
    const resolved = resolveSource(source);
    if (!resolved)
        return;
    AudioModule.clearPreloadedSource(resolved);
}
export function clearAllPreloadedSources() {
    AudioModule.clearAllPreloadedSources();
}
export function getPreloadedSources() {
    return AudioModule.getPreloadedSources();
}
export { AudioModule };
//# sourceMappingURL=ExpoAudio.web.js.map