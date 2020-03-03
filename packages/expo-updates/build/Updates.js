import { RCTDeviceEventEmitter, UnavailabilityError } from '@unimodules/core';
import { EventEmitter } from 'fbemitter';
import ExpoUpdates from './ExpoUpdates';
export var UpdateEventType;
(function (UpdateEventType) {
    UpdateEventType["UPDATE_AVAILABLE"] = "updateAvailable";
    UpdateEventType["NO_UPDATE_AVAILABLE"] = "noUpdateAvailable";
    UpdateEventType["ERROR"] = "error";
})(UpdateEventType || (UpdateEventType = {}));
export const localAssets = ExpoUpdates.localAssets ?? {};
export const manifest = ExpoUpdates.manifest ?? {};
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
    if (result.manifestString) {
        result.manifest = JSON.parse(result.manifestString);
        delete result.manifestString;
    }
    return result;
}
export async function fetchUpdateAsync() {
    if (!ExpoUpdates.fetchUpdateAsync) {
        throw new UnavailabilityError('Updates', 'fetchUpdateAsync');
    }
    const result = await ExpoUpdates.fetchUpdateAsync();
    if (result.manifestString) {
        result.manifest = JSON.parse(result.manifestString);
        delete result.manifestString;
    }
    return result;
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