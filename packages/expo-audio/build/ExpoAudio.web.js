import { useEvent } from 'expo';
import { useEffect, useState, useMemo } from 'react';
import { AUDIO_SAMPLE_UPDATE, PLAYBACK_STATUS_UPDATE, RECORDING_STATUS_UPDATE, } from './AudioEventKeys';
import * as AudioModule from './AudioModule.web';
import { createRecordingOptions } from './utils/options';
import { resolveSource, resolveSourceWithDownload } from './utils/resolveSource';
// Global registry for cleaning up object URLs when players are garbage collected
// Since we are using blob urls, we need to clean them up when the player is garbage collected
// this is only used for createAudioPlayer, as we have lifecycle management in useAudioPlayer
const objectUrlRegistry = new FinalizationRegistry((objectUrl) => {
    URL.revokeObjectURL(objectUrl);
});
export function createAudioPlayer(source = null, options = {}) {
    const { downloadFirst = false } = options;
    // If downloadFirst is true, we don't need to resolve the source, because it will be replaced once the source is downloaded.
    // If downloadFirst is false, we resolve the source here.
    const initialSource = downloadFirst ? null : resolveSource(source);
    const player = new AudioModule.AudioPlayerWeb(initialSource, options);
    // we call .replace() on the player to replace the source with the downloaded one
    // only relevant if downloadFirst is true and source is not null
    if (downloadFirst && source) {
        resolveSourceWithDownload(source)
            .then((resolved) => {
            if (resolved) {
                // Register object URL for automatic cleanup when player is garbage collected
                if (resolved &&
                    typeof resolved === 'object' &&
                    resolved.uri &&
                    resolved.uri.startsWith('blob:')) {
                    objectUrlRegistry.register(player, resolved.uri);
                }
                player.replace(resolved);
            }
        })
            .catch((error) => {
            console.warn('expo-audio: Failed to download source, using fallback:', error);
            const fallback = resolveSource(source);
            if (fallback) {
                player.replace(fallback);
            }
        });
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
    const player = useMemo(() => new AudioModule.AudioPlayerWeb(initialSource, options), [JSON.stringify(initialSource), JSON.stringify(options)]);
    // Handle async source resolution for downloadFirst
    useEffect(() => {
        if (!downloadFirst || source === null) {
            return;
        }
        let isCancelled = false;
        let objectUrl = null;
        // We resolve the source with expo-asset and replace the player's source with the downloaded one.
        async function resolveAndReplaceSource() {
            try {
                const resolved = await resolveSourceWithDownload(source);
                if (!isCancelled &&
                    resolved &&
                    JSON.stringify(resolved) !== JSON.stringify(initialSource)) {
                    // Track the object URL for cleanup
                    if (resolved &&
                        typeof resolved === 'object' &&
                        resolved.uri &&
                        resolved.uri.startsWith('blob:')) {
                        objectUrl = resolved.uri;
                    }
                    player.replace(resolved);
                }
            }
            catch (error) {
                if (!isCancelled) {
                    console.warn('expo-audio: Failed to download source, using original:', error);
                }
            }
        }
        resolveAndReplaceSource();
        return () => {
            isCancelled = true;
            player.remove();
            // Revoke the object URL created by this hook instance
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
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
export { AudioModule };
//# sourceMappingURL=ExpoAudio.web.js.map