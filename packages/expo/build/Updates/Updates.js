import { RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import { EventEmitter } from 'fbemitter';
import ExponentUpdates from './ExponentUpdates';
export async function reload() {
    await ExponentUpdates.reload();
}
export async function reloadFromCache() {
    await ExponentUpdates.reloadFromCache();
}
export async function checkForUpdateAsync() {
    if (!ExponentUpdates.checkForUpdateAsync) {
        throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
    }
    const result = await ExponentUpdates.checkForUpdateAsync();
    if (!result) {
        return { isAvailable: false };
    }
    return {
        isAvailable: true,
        manifest: typeof result === 'string' ? JSON.parse(result) : result,
    };
}
export async function fetchUpdateAsync({ eventListener, } = {}) {
    if (!ExponentUpdates.fetchUpdateAsync) {
        throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
    }
    let subscription;
    let result;
    if (eventListener && typeof eventListener === 'function') {
        subscription = addListener(eventListener);
    }
    try {
        result = await ExponentUpdates.fetchUpdateAsync();
    }
    finally {
        subscription && subscription.remove();
    }
    if (!result) {
        return { isNew: false };
    }
    return {
        isNew: true,
        manifest: typeof result === 'string' ? JSON.parse(result) : result,
    };
}
export async function clearUpdateCacheExperimentalAsync(abiVersion) {
    if (!ExponentUpdates.clearUpdateCacheAsync) {
        throw new UnavailabilityError('Updates', 'clearUpdateCacheAsync');
    }
    return ExponentUpdates.clearUpdateCacheAsync(abiVersion);
}
let _emitter;
function _getEmitter() {
    if (!_emitter) {
        _emitter = new EventEmitter();
        RCTDeviceEventEmitter.addListener('Exponent.nativeUpdatesEvent', _emitEvent);
    }
    return _emitter;
}
function _emitEvent(params) {
    let newParams = params;
    if (typeof params === 'string') {
        newParams = JSON.parse(params);
    }
    if (newParams.manifestString) {
        newParams.manifest = JSON.parse(newParams.manifestString);
        delete newParams.manifestString;
    }
    if (!_emitter) {
        throw new Error(`EventEmitter must be initialized to use from its listener`);
    }
    _emitter.emit('Exponent.updatesEvent', newParams);
}
export function addListener(listener) {
    const emitter = _getEmitter();
    return emitter.addListener('Exponent.updatesEvent', listener);
}
export const EventType = {
    DOWNLOAD_STARTED: 'downloadStart',
    DOWNLOAD_PROGRESS: 'downloadProgress',
    DOWNLOAD_FINISHED: 'downloadFinished',
    NO_UPDATE_AVAILABLE: 'noUpdateAvailable',
    ERROR: 'error',
};
//# sourceMappingURL=Updates.js.map