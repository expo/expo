import { PermissionResponse, PermissionStatus } from 'expo-modules-core';

import {
  LocationLastKnownOptions,
  LocationObject,
  LocationOptions,
  LocationAccuracy,
} from './Location.types';
import { LocationEventEmitter } from './LocationEventEmitter';

class GeocoderError extends Error {
  code: string;

  constructor() {
    super('Geocoder service is not available for this device.');
    this.code = 'E_NO_GEOCODER';
  }
}

/**
 * Converts `GeolocationPosition` to JavaScript object.
 */
function geolocationPositionToJSON(position: LocationObject): LocationObject {
  const { coords, timestamp } = position;
  return {
    coords: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      accuracy: coords.accuracy,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
    },
    timestamp,
  };
}

/**
 * Checks whether given location didn't exceed given `maxAge` and fits in the required accuracy.
 */
function isLocationValid(location: LocationObject, options: LocationLastKnownOptions): boolean {
  const maxAge = typeof options.maxAge === 'number' ? options.maxAge : Infinity;
  const requiredAccuracy =
    typeof options.requiredAccuracy === 'number' ? options.requiredAccuracy : Infinity;
  const locationAccuracy = location.coords.accuracy ?? Infinity;

  return Date.now() - location.timestamp <= maxAge && locationAccuracy <= requiredAccuracy;
}

/**
 * Gets the permission details. The implementation is not very good as it actually requests
 * for the current location, but there is no better way on web so far :(
 */
async function getPermissionsAsync(): Promise<PermissionResponse> {
  return new Promise<PermissionResponse>(resolve => {
    const resolveWithStatus = status =>
      resolve({
        status,
        granted: status === PermissionStatus.GRANTED,
        canAskAgain: true,
        expires: 0,
      });

    navigator.geolocation.getCurrentPosition(
      () => resolveWithStatus(PermissionStatus.GRANTED),
      ({ code }) => {
        if (code === 1 /* PERMISSION_DENIED */) {
          resolveWithStatus(PermissionStatus.DENIED);
        } else {
          resolveWithStatus(PermissionStatus.UNDETERMINED);
        }
      },
      { enableHighAccuracy: false, maximumAge: Infinity }
    );
  });
}

let lastKnownPosition: LocationObject | null = null;

export default {
  get name(): string {
    return 'ExpoLocation';
  },
  async getProviderStatusAsync(): Promise<{ locationServicesEnabled: boolean }> {
    return {
      locationServicesEnabled: 'geolocation' in navigator,
    };
  },
  async getLastKnownPositionAsync(
    options: LocationLastKnownOptions = {}
  ): Promise<LocationObject | null> {
    if (lastKnownPosition && isLocationValid(lastKnownPosition, options)) {
      return lastKnownPosition;
    }
    return null;
  },
  async getCurrentPositionAsync(options: LocationOptions): Promise<LocationObject> {
    return new Promise<LocationObject>((resolve, reject) => {
      const resolver = position => {
        lastKnownPosition = geolocationPositionToJSON(position);
        resolve(lastKnownPosition);
      };
      navigator.geolocation.getCurrentPosition(resolver, reject, {
        maximumAge: Infinity,
        enableHighAccuracy: (options.accuracy ?? 0) > LocationAccuracy.Balanced,
        ...options,
      });
    });
  },
  async removeWatchAsync(watchId): Promise<void> {
    navigator.geolocation.clearWatch(watchId);
  },
  async watchDeviceHeading(headingId): Promise<void> {
    console.warn('Location.watchDeviceHeading: is not supported on web');
  },
  async hasServicesEnabledAsync(): Promise<boolean> {
    return 'geolocation' in navigator;
  },
  async geocodeAsync(): Promise<any[]> {
    throw new GeocoderError();
  },
  async reverseGeocodeAsync(): Promise<any[]> {
    throw new GeocoderError();
  },
  async watchPositionImplAsync(watchId: string, options: LocationOptions): Promise<string> {
    return new Promise<string>(resolve => {
      // @ts-ignore: the types here need to be fixed
      watchId = global.navigator.geolocation.watchPosition(
        position => {
          lastKnownPosition = geolocationPositionToJSON(position);
          LocationEventEmitter.emit('Expo.locationChanged', {
            watchId,
            location: lastKnownPosition,
          });
        },
        undefined,
        // @ts-ignore: the options object needs to be fixed
        options
      );
      resolve(watchId);
    });
  },

  getPermissionsAsync,
  async requestPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync();
  },
  async requestForegroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync();
  },
  async requestBackgroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync();
  },
  async getForegroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync();
  },
  async getBackgroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync();
  },

  // no-op
  startObserving() {},
  stopObserving() {},
};
