import { RCTDeviceEventEmitter, CodedError, UnavailabilityError } from '@unimodules/core';
import { EventEmitter } from 'fbemitter';
import ExpoUpdates from './ExpoUpdates';
export * from './Updates.types';
export const updateId = ExpoUpdates.updateId && typeof ExpoUpdates.updateId === 'string'
    ? ExpoUpdates.updateId.toLowerCase()
    : null;
export const releaseChannel = ExpoUpdates.releaseChannel ?? 'default';
export const localAssets = ExpoUpdates.localAssets ?? {};
export const isEmergencyLaunch = ExpoUpdates.isEmergencyLaunch || false;
export const isUsingEmbeddedAssets = ExpoUpdates.isUsingEmbeddedAssets || false;
let _manifest = ExpoUpdates.manifest;
if (ExpoUpdates.manifestString) {
    _manifest = JSON.parse(ExpoUpdates.manifestString);
}
export const manifest = _manifest ?? {};
export async function reloadAsync() {
    if (!ExpoUpdates.reload) {
        throw new UnavailabilityError('Updates', 'reloadAsync');
    }
    if (__DEV__) {
        throw new CodedError('ERR_UPDATES_DISABLED', 'You cannot use the Updates module in development mode. To test manual updates, make a ' +
            'release build with `npm run ios --configuration Release` or ' +
            '`npm run android --variant Release`.');
    }
    await ExpoUpdates.reload();
}
export async function checkForUpdateAsync() {
    if (!ExpoUpdates.checkForUpdateAsync) {
        throw new UnavailabilityError('Updates', 'checkForUpdateAsync');
    }
    if (__DEV__) {
        throw new CodedError('ERR_UPDATES_DISABLED', 'You cannot check for updates in development mode. To test manual updates, make a ' +
            'release build with `npm run ios --configuration Release` or ' +
            '`npm run android --variant Release`.');
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
    if (__DEV__) {
        throw new CodedError('ERR_UPDATES_DISABLED', 'You cannot fetch updates in development mode. To test manual updates, make a ' +
            'release build with `npm run ios --configuration Release` or ' +
            '`npm run android --variant Release`.');
    }
    const result = await ExpoUpdates.fetchUpdateAsync();
    if (result.manifestString) {
        result.manifest = JSON.parse(result.manifestString);
        delete result.manifestString;
    }
    return result;
}
export function clearUpdateCacheExperimentalAsync(_sdkVersion) {
    console.warn("This method is no longer necessary. `expo-updates` now automatically deletes your app's old bundle files!");
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
    const emitter = _getEmitter();
    return emitter.addListener('Expo.updatesEvent', listener);
}
//# sourceMappingURL=Updates.js.map