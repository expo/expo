import { Platform } from 'expo-modules-core';
import ExpoLocation from './ExpoLocation';
import { LocationAccuracy } from './Location.types';
import { LocationSubscriber } from './LocationSubscribers';
// @needsAudit
/**
 * Polyfills `navigator.geolocation` for interop with the core React Native and Web API approach to geolocation.
 */
export function installWebGeolocationPolyfill() {
    if (Platform.OS !== 'web') {
        // Make sure `window.navigator` is defined in the global scope.
        if (!('window' in global)) {
            global.window = global;
        }
        if (!('navigator' in global.window)) {
            global.window.navigator = {};
        }
        // @ts-ignore
        window.navigator.geolocation = {
            getCurrentPosition,
            watchPosition,
            clearWatch,
        };
    }
}
function convertGeolocationOptions(options) {
    return {
        accuracy: options.enableHighAccuracy ? LocationAccuracy.High : LocationAccuracy.Balanced,
    };
}
function getCurrentPosition(success, error = () => { }, options = {}) {
    _getCurrentPositionAsyncWrapper(success, error, options);
}
// This function exists to let us continue to return undefined from getCurrentPosition, while still
// using async/await for the internal implementation of it
async function _getCurrentPositionAsyncWrapper(success, error, options) {
    try {
        await ExpoLocation.requestPermissionsAsync();
        const result = await ExpoLocation.getCurrentPositionAsync(convertGeolocationOptions(options));
        success(result);
    }
    catch (e) {
        error(e);
    }
}
// Polyfill: navigator.geolocation.watchPosition
function watchPosition(success, error, options) {
    const watchId = LocationSubscriber.registerCallback(success);
    ExpoLocation.watchPositionImplAsync(watchId, options).catch((err) => {
        LocationSubscriber.unregisterCallback(watchId);
        error({ watchId, message: err.message, code: err.code });
    });
    return watchId;
}
// Polyfill: navigator.geolocation.clearWatch
function clearWatch(watchId) {
    LocationSubscriber.unregisterCallback(watchId);
}
//# sourceMappingURL=GeolocationPolyfill.js.map