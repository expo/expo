import { PermissionStatus } from 'expo-modules-core';
import { activePlayers } from './AudioPlayer.web';
import { getUserMedia, getSourceUri, preloadCache } from './AudioUtils.web';
export { AudioPlayerWeb } from './AudioPlayer.web';
export { AudioPlaylistWeb } from './AudioPlaylist.web';
export { AudioRecorderWeb } from './AudioRecorder.web';
export let isAudioActive = true;
async function getPermissionWithQueryAsync(name) {
    if (!navigator || !navigator.permissions || !navigator.permissions.query)
        return null;
    try {
        const { state } = await navigator.permissions.query({ name });
        switch (state) {
            case 'granted':
                return PermissionStatus.GRANTED;
            case 'denied':
                return PermissionStatus.DENIED;
            default:
                return PermissionStatus.UNDETERMINED;
        }
    }
    catch {
        // Firefox - TypeError: 'microphone' (value of 'name' member of PermissionDescriptor) is not a valid value for enumeration PermissionName.
        return PermissionStatus.UNDETERMINED;
    }
}
export async function setAudioModeAsync(mode) { }
export async function setIsAudioActiveAsync(active) {
    isAudioActive = active;
    if (!active) {
        for (const player of activePlayers) {
            if (player.playing) {
                player.pause();
            }
        }
    }
}
export async function preloadAsync(source) {
    const uri = getSourceUri(source);
    if (!uri || preloadCache.has(uri))
        return;
    const headers = source && typeof source === 'object' && !Array.isArray(source) ? source.headers : undefined;
    const response = await fetch(uri, headers ? { headers } : undefined);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const audio = new Audio(blobUrl);
    audio.preload = 'auto';
    preloadCache.set(uri, { blobUrl, audio });
}
export function preload(source) {
    preloadAsync(source).catch(() => { });
}
export function clearPreloadedSource(source) {
    const uri = getSourceUri(source);
    if (!uri)
        return;
    const cached = preloadCache.get(uri);
    if (cached) {
        URL.revokeObjectURL(cached.blobUrl);
        preloadCache.delete(uri);
    }
}
export function clearAllPreloadedSources() {
    for (const cached of preloadCache.values()) {
        URL.revokeObjectURL(cached.blobUrl);
    }
    preloadCache.clear();
}
export function getPreloadedSources() {
    return Array.from(preloadCache.keys());
}
export async function getRecordingPermissionsAsync() {
    const maybeStatus = await getPermissionWithQueryAsync('microphone');
    switch (maybeStatus) {
        case PermissionStatus.GRANTED:
            return {
                status: PermissionStatus.GRANTED,
                expires: 'never',
                canAskAgain: true,
                granted: true,
            };
        case PermissionStatus.DENIED:
            return {
                status: PermissionStatus.DENIED,
                expires: 'never',
                canAskAgain: true,
                granted: false,
            };
        default:
            return await requestRecordingPermissionsAsync();
    }
}
export async function requestRecordingPermissionsAsync() {
    try {
        const stream = await getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return {
            status: PermissionStatus.GRANTED,
            expires: 'never',
            canAskAgain: true,
            granted: true,
        };
    }
    catch {
        return {
            status: PermissionStatus.DENIED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
        };
    }
}
//# sourceMappingURL=AudioModule.web.js.map