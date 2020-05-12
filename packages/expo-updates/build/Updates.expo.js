import { RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import Constants from 'expo-constants';
import { EventEmitter } from 'fbemitter';
import ExponentUpdates from './ExponentUpdates';
import { UpdateEventType, } from './Updates.types';
export * from './Updates.types';
export const localAssets = {};
export const manifest = Constants.manifest ?? {};
export const updateId = manifest.hasOwnProperty('releaseId')
    ? manifest.releaseId.toLowerCase()
    : null;
export const releaseChannel = manifest.hasOwnProperty('releaseChannel')
    ? manifest.releaseChannel
    : 'default';
export const isEmergencyLaunch = false;
export const isUsingEmbeddedAssets = false;
export async function reloadAsync() {
    if (!ExponentUpdates.reloadFromCache) {
        throw new UnavailabilityError('Updates', 'reloadAsync');
    }
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
export async function fetchUpdateAsync() {
    if (!ExponentUpdates.fetchUpdateAsync) {
        throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
    }
    _isFetchingUpdate = true;
    const result = await ExponentUpdates.fetchUpdateAsync();
    setTimeout(() => {
        _isFetchingUpdate = false;
    }, 0);
    if (!result) {
        return { isNew: false };
    }
    return {
        isNew: true,
        manifest: typeof result === 'string' ? JSON.parse(result) : result,
    };
}
let _emitter;
let _isFetchingUpdate = false;
function _getEmitter() {
    if (!_emitter) {
        _emitter = new EventEmitter();
        RCTDeviceEventEmitter.addListener('Exponent.nativeUpdatesEvent', _emitEvent);
    }
    return _emitter;
}
function _emitEvent(params) {
    // The legacy implementation emits additional events during the `fetchUpdateAsync` call. Since the
    // new implementation does not do this, we should ignore these events.
    if (_isFetchingUpdate) {
        return;
    }
    let newParams = params;
    if (typeof params === 'string') {
        newParams = JSON.parse(params);
    }
    if (newParams.manifestString) {
        newParams.manifest = JSON.parse(newParams.manifestString);
        delete newParams.manifestString;
    }
    // transform legacy event types
    if (newParams.type === LegacyUpdatesEventType.DOWNLOAD_STARTED ||
        newParams.type === LegacyUpdatesEventType.DOWNLOAD_PROGRESS) {
        return;
    }
    else if (newParams.type === LegacyUpdatesEventType.DOWNLOAD_FINISHED) {
        newParams.type = UpdateEventType.UPDATE_AVAILABLE;
    }
    if (!_emitter) {
        throw new Error(`EventEmitter must be initialized to use from its listener`);
    }
    _emitter.emit('Expo.updatesEvent', newParams);
}
export function addListener(listener) {
    const emitter = _getEmitter();
    return emitter.addListener('Expo.updatesEvent', listener);
}
var LegacyUpdatesEventType;
(function (LegacyUpdatesEventType) {
    LegacyUpdatesEventType["DOWNLOAD_STARTED"] = "downloadStart";
    LegacyUpdatesEventType["DOWNLOAD_PROGRESS"] = "downloadProgress";
    LegacyUpdatesEventType["DOWNLOAD_FINISHED"] = "downloadFinished";
    LegacyUpdatesEventType["NO_UPDATE_AVAILABLE"] = "noUpdateAvailable";
    LegacyUpdatesEventType["ERROR"] = "error";
})(LegacyUpdatesEventType || (LegacyUpdatesEventType = {}));
//# sourceMappingURL=Updates.expo.js.map