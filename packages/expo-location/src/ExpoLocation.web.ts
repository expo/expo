import { PermissionResponse, PermissionStatus, UnavailabilityError } from 'expo-modules-core';

import {
  LocationAccuracy,
  LocationLastKnownOptions,
  LocationObject,
  LocationOptions,
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
 * Gets the permission details. The implementation is not very good as it's not
 * possible to query for permission on all browsers, apparently only the
 * latest versions will support this.
 */
async function getPermissionsAsync(shouldAsk = false): Promise<PermissionResponse> {
  if (!navigator?.permissions?.query) {
    throw new UnavailabilityError('expo-location', 'navigator.permissions API is not available');
  }

  const permission = await navigator.permissions.query({ name: 'geolocation' });

  if (permission.state === 'granted') {
    return {
      status: PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 0,
    };
  }

  if (permission.state === 'denied') {
    return {
      status: PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: 0,
    };
  }

  if (shouldAsk) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          resolve({
            status: PermissionStatus.GRANTED,
            granted: true,
            canAskAgain: true,
            expires: 0,
          });
        },
        (positionError: GeolocationPositionError) => {
          if (positionError.code === positionError.PERMISSION_DENIED) {
            resolve({
              status: PermissionStatus.DENIED,
              granted: false,
              canAskAgain: true,
              expires: 0,
            });
            return;
          }

          resolve({
            status: PermissionStatus.GRANTED,
            granted: false,
            canAskAgain: true,
            expires: 0,
          });
        }
      );
    });
  }

  // The permission state is 'prompt' when the permission has not been requested
  // yet, tested on Chrome.
  return {
    status: PermissionStatus.UNDETERMINED,
    granted: false,
    canAskAgain: true,
    expires: 0,
  };
}

let lastKnownPosition: LocationObject | null = null;

export default {
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
      const resolver = (position) => {
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
    return new Promise<string>((resolve) => {
      // @ts-ignore: the types here need to be fixed
      watchId = global.navigator.geolocation.watchPosition(
        (position) => {
          lastKnownPosition = geolocationPositionToJSON(position);
          LocationEventEmitter.emit('Expo.locationChanged', {
            watchId,
            location: lastKnownPosition,
          });
        },
        undefined,
        options
      );
      resolve(watchId);
    });
  },

  async requestForegroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync(true);
  },
  async requestBackgroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync(true);
  },
  async getForegroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync();
  },
  async getBackgroundPermissionsAsync(): Promise<PermissionResponse> {
    return getPermissionsAsync();
  },
};
