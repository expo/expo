import { RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import { EventEmitter } from 'fbemitter';
import ExpoUpdates from './ExpoUpdates';
export var EventType;
(function (EventType) {
    EventType["UPDATE_AVAILABLE"] = "updateAvailable";
    EventType["NO_UPDATE_AVAILABLE"] = "noUpdateAvailable";
    EventType["ERROR"] = "error";
})(EventType || (EventType = {}));
export const localAssets = ExpoUpdates.localAssets || {};
export const manifest = ExpoUpdates.manifest || {};
export const isEmergencyLaunch = ExpoUpdates.isEmergencyLaunch || false;
export async function reloadAsync() {
    if (!ExpoUpdates.reload) {
        throw new UnavailabilityError('Updates', 'reloadAsync');
    }
    await ExpoUpdates.reload();
}
export async function checkForUpdateAsync() {
    if (!ExpoUpdates.checkForUpdateAsync) {
        throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
    }
    const result = await ExpoUpdates.checkForUpdateAsync();
    if (!result) {
        return { isAvailable: false };
    }
    return {
        isAvailable: true,
        manifest: typeof result === 'string' ? JSON.parse(result) : result,
    };
}
export async function fetchUpdateAsync() {
    if (!ExpoUpdates.fetchUpdateAsync) {
        throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
    }
    const result = await ExpoUpdates.fetchUpdateAsync();
    if (!result) {
        return { isNew: false };
    }
    return {
        isNew: true,
        manifest: typeof result === 'string' ? JSON.parse(result) : result,
    };
}
let _emitter;
function _getEmitter() {
    if (!_emitter) {
        _emitter = new EventEmitter();
        RCTDeviceEventEmitter.addListener('Expo.nativeUpdatesEvent', _emitEvent);
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
    _emitter.emit('Expo.updatesEvent', newParams);
}
export function addListener(listener) {
    let emitter = _getEmitter();
    return emitter.addListener('Expo.updatesEvent', listener);
}
//# sourceMappingURL=Updates.js.map