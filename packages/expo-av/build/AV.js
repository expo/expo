import { Asset } from 'expo-asset';
import { Platform } from 'expo-modules-core';
import { PitchCorrectionQuality, } from './AV.types';
// TODO add:
//  disableFocusOnAndroid
//  audio routes (at least did become noisy on android)
//  pan
//  pitch
//  API to explicitly request audio focus / session
//  API to select stream type on Android
//  subtitles API
/**
 * @hidden
 */
export const _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS = 500;
// @needsAudit
/**
 * The default initial `AVPlaybackStatusToSet` of all `Audio.Sound` objects and `Video` components is as follows:
 *
 * ```javascript
 * {
 *   progressUpdateIntervalMillis: 500,
 *   positionMillis: 0,
 *   shouldPlay: false,
 *   rate: 1.0,
 *   shouldCorrectPitch: false,
 *   volume: 1.0,
 *   isMuted: false,
 *   isLooping: false,
 * }
 * ```
 *
 * This default initial status can be overwritten by setting the optional `initialStatus` in `loadAsync()` or `Audio.Sound.createAsync()`.
 */
export const _DEFAULT_INITIAL_PLAYBACK_STATUS = {
    positionMillis: 0,
    progressUpdateIntervalMillis: _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS,
    shouldPlay: false,
    rate: 1.0,
    shouldCorrectPitch: false,
    volume: 1.0,
    audioPan: 0,
    isMuted: false,
    isLooping: false,
};
// @needsAudit
/**
 * @hidden
 */
export function getNativeSourceFromSource(source) {
    let uri = null;
    let overridingExtension = null;
    let headers;
    if (typeof source === 'string' && Platform.OS === 'web') {
        return {
            uri: source,
            overridingExtension,
            headers,
        };
    }
    const asset = _getAssetFromPlaybackSource(source);
    if (asset != null) {
        uri = asset.localUri || asset.uri;
    }
    else if (source != null &&
        typeof source !== 'number' &&
        'uri' in source &&
        typeof source.uri === 'string') {
        uri = source.uri;
    }
    if (uri == null) {
        return null;
    }
    if (source != null &&
        typeof source !== 'number' &&
        'overrideFileExtensionAndroid' in source &&
        typeof source.overrideFileExtensionAndroid === 'string') {
        overridingExtension = source.overrideFileExtensionAndroid;
    }
    if (source != null &&
        typeof source !== 'number' &&
        'headers' in source &&
        typeof source.headers === 'object') {
        headers = source.headers;
    }
    return { uri, overridingExtension, headers };
}
function _getAssetFromPlaybackSource(source) {
    if (source == null) {
        return null;
    }
    let asset = null;
    if (typeof source === 'number') {
        asset = Asset.fromModule(source);
    }
    else if (source instanceof Asset) {
        asset = source;
    }
    return asset;
}
// @needsAudit
/**
 * @hidden
 */
export function assertStatusValuesInBounds(status) {
    if (typeof status.rate === 'number' && (status.rate < 0 || status.rate > 32)) {
        throw new RangeError('Rate value must be between 0.0 and 32.0');
    }
    if (typeof status.volume === 'number' && (status.volume < 0 || status.volume > 1)) {
        throw new RangeError('Volume value must be between 0.0 and 1.0');
    }
    if (typeof status.audioPan === 'number' && (status.audioPan < -1 || status.audioPan > 1)) {
        throw new RangeError('Pan value must be between -1.0 and 1.0');
    }
}
// @needsAudit
/**
 * @hidden
 */
export async function getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst) {
    // Get the full initial status
    const fullInitialStatus = initialStatus == null
        ? _DEFAULT_INITIAL_PLAYBACK_STATUS
        : {
            ..._DEFAULT_INITIAL_PLAYBACK_STATUS,
            ...initialStatus,
        };
    assertStatusValuesInBounds(fullInitialStatus);
    if (typeof source === 'string' && Platform.OS === 'web') {
        return {
            nativeSource: {
                uri: source,
                overridingExtension: null,
            },
            fullInitialStatus,
        };
    }
    // Download first if necessary.
    const asset = _getAssetFromPlaybackSource(source);
    if (downloadFirst && asset) {
        // TODO we can download remote uri too once @nikki93 has integrated this into Asset
        await asset.downloadAsync();
    }
    // Get the native source
    const nativeSource = getNativeSourceFromSource(source);
    if (nativeSource === null) {
        throw new Error(`Cannot load an AV asset from a null playback source`);
    }
    // If asset has been downloaded use the localUri
    if (asset && asset.localUri) {
        nativeSource.uri = asset.localUri;
    }
    return { nativeSource, fullInitialStatus };
}
// @needsAudit
/**
 * @hidden
 */
export function getUnloadedStatus(error = null) {
    return {
        isLoaded: false,
        ...(error ? { error } : null),
    };
}
/**
 * @hidden
 * A mixin that defines common playback methods for A/V classes, so they implement the `Playback`
 * interface.
 */
export const PlaybackMixin = {
    async playAsync() {
        return this.setStatusAsync({ shouldPlay: true });
    },
    async playFromPositionAsync(positionMillis, tolerances = {}) {
        return this.setStatusAsync({
            positionMillis,
            shouldPlay: true,
            seekMillisToleranceAfter: tolerances.toleranceMillisAfter,
            seekMillisToleranceBefore: tolerances.toleranceMillisBefore,
        });
    },
    async pauseAsync() {
        return this.setStatusAsync({ shouldPlay: false });
    },
    async stopAsync() {
        return this.setStatusAsync({ positionMillis: 0, shouldPlay: false });
    },
    async setPositionAsync(positionMillis, tolerances = {}) {
        return this.setStatusAsync({
            positionMillis,
            seekMillisToleranceAfter: tolerances.toleranceMillisAfter,
            seekMillisToleranceBefore: tolerances.toleranceMillisBefore,
        });
    },
    async setRateAsync(rate, shouldCorrectPitch = false, pitchCorrectionQuality = PitchCorrectionQuality.Medium) {
        return this.setStatusAsync({
            rate,
            shouldCorrectPitch,
            pitchCorrectionQuality,
        });
    },
    async setVolumeAsync(volume, audioPan) {
        return this.setStatusAsync({ volume, audioPan });
    },
    async setIsMutedAsync(isMuted) {
        return this.setStatusAsync({ isMuted });
    },
    async setIsLoopingAsync(isLooping) {
        return this.setStatusAsync({ isLooping });
    },
    async setProgressUpdateIntervalAsync(progressUpdateIntervalMillis) {
        return this.setStatusAsync({ progressUpdateIntervalMillis });
    },
};
export * from './AV.types';
//# sourceMappingURL=AV.js.map