import { Platform } from 'expo-modules-core';

import ExpoLocation from './ExpoLocation';
import { LocationObject, LocationAccuracy, LocationOptions } from './Location.types';
import { LocationSubscriber } from './LocationSubscribers';

type GeolocationSuccessCallback = (data: LocationObject) => void;
type GeolocationErrorCallback = (error: any) => void;

type GeolocationOptions = {
  enableHighAccuracy?: boolean;
};

declare const global: any;

// @needsAudit
/**
 * Polyfills `navigator.geolocation` for interop with the core React Native and Web API approach to geolocation.
 */
export function installWebGeolocationPolyfill(): void {
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

function convertGeolocationOptions(options: GeolocationOptions): LocationOptions {
  return {
    accuracy: options.enableHighAccuracy ? LocationAccuracy.High : LocationAccuracy.Balanced,
  };
}

function getCurrentPosition(
  success: GeolocationSuccessCallback,
  error: GeolocationErrorCallback = () => {},
  options: GeolocationOptions = {}
): void {
  _getCurrentPositionAsyncWrapper(success, error, options);
}

// This function exists to let us continue to return undefined from getCurrentPosition, while still
// using async/await for the internal implementation of it
async function _getCurrentPositionAsyncWrapper(
  success: GeolocationSuccessCallback,
  error: GeolocationErrorCallback,
  options: GeolocationOptions
): Promise<any> {
  try {
    await ExpoLocation.requestPermissionsAsync();
    const result = await ExpoLocation.getCurrentPositionAsync(convertGeolocationOptions(options));
    success(result);
  } catch (e) {
    error(e);
  }
}

// Polyfill: navigator.geolocation.watchPosition
function watchPosition(
  success: GeolocationSuccessCallback,
  error: GeolocationErrorCallback,
  options: GeolocationOptions
) {
  const watchId = LocationSubscriber.registerCallback(success);

  ExpoLocation.watchPositionImplAsync(watchId, options).catch((err) => {
    LocationSubscriber.unregisterCallback(watchId);
    error({ watchId, message: err.message, code: err.code });
  });

  return watchId;
}

// Polyfill: navigator.geolocation.clearWatch
function clearWatch(watchId: number) {
  LocationSubscriber.unregisterCallback(watchId);
}
