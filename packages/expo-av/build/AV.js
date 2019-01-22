import { Asset } from 'expo-asset';
export const _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS = 500;
export const _DEFAULT_INITIAL_PLAYBACK_STATUS = {
    positionMillis: 0,
    progressUpdateIntervalMillis: _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS,
    shouldPlay: false,
    rate: 1.0,
    shouldCorrectPitch: false,
    volume: 1.0,
    isMuted: false,
    isLooping: false,
};
export function getNativeSourceFromSource(source) {
    let uri = null;
    let overridingExtension = null;
    let headers;
    let asset = _getAssetFromPlaybackSource(source);
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
    if (source != null && typeof source !== 'number' && 'headers' in source && typeof source.headers === 'object') {
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
export function assertStatusValuesInBounds(status) {
    if (typeof status.rate === 'number' && (status.rate < 0 || status.rate > 32)) {
        throw new RangeError('Rate value must be between 0.0 and 32.0');
    }
    if (typeof status.volume === 'number' && (status.volume < 0 || status.volume > 1)) {
        throw new RangeError('Volume value must be between 0.0 and 1.0');
    }
}
export async function getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst) {
    // Download first if necessary.
    let asset = _getAssetFromPlaybackSource(source);
    if (downloadFirst && asset) {
        // TODO we can download remote uri too once @nikki93 has integrated this into Asset
        await asset.downloadAsync();
    }
    // Get the native source
    const nativeSource = getNativeSourceFromSource(source);
    if (nativeSource === null) {
        throw new Error(`Cannot load an AV asset from a null playback source`);
    }
    // Get the full initial status
    const fullInitialStatus = initialStatus == null
        ? _DEFAULT_INITIAL_PLAYBACK_STATUS
        : {
            ..._DEFAULT_INITIAL_PLAYBACK_STATUS,
            ...initialStatus,
        };
    assertStatusValuesInBounds(fullInitialStatus);
    return { nativeSource, fullInitialStatus };
}
export function getUnloadedStatus(error = null) {
    return {
        isLoaded: false,
        ...(error ? { error } : null),
    };
}
/**
 * A mixin that defines common playback methods for A/V classes so they implement the `Playback`
 * interface
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
    async setRateAsync(rate, shouldCorrectPitch) {
        return this.setStatusAsync({ rate, shouldCorrectPitch });
    },
    async setVolumeAsync(volume) {
        return this.setStatusAsync({ volume });
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
//# sourceMappingURL=AV.js.map