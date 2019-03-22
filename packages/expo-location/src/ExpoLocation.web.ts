import { EventEmitter } from '@unimodules/core';

interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

interface Position {
  coords: Coordinates;
  timestamp: number;
}

interface PermissionResult {
  status: string;
}

class GeocoderError extends Error {
  code: string;

  constructor() {
    super('Geocoder service is not available for this device.');
    this.code = 'E_NO_GEOCODER';
  }
}

const emitter = new EventEmitter({} as any);

function positionToJSON(position: any): Position | null {
  if (!position) return null;

  const { coords = {}, timestamp } = position;
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

export default {
  get name(): string {
    return 'ExpoLocation';
  },
  async getProviderStatusAsync(): Promise<{ locationServicesEnabled: boolean }> {
    return {
      locationServicesEnabled: 'geolocation' in navigator,
    };
  },
  async getCurrentPositionAsync(options: Object): Promise<Position | null> {
    return new Promise<Position | null>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        position => resolve(positionToJSON(position)),
        reject,
        options
      )
    );
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
  async geocodeAsync(): Promise<Array<any>> {
    throw new GeocoderError();
  },
  async reverseGeocodeAsync(): Promise<Array<any>> {
    throw new GeocoderError();
  },
  async watchPositionImplAsync(watchId: string, options: Object): Promise<string> {
    return new Promise<string>(resolve => {
      // @ts-ignore
      watchId = global.navigator.geolocation.watchPosition(
        location => {
          emitter.emit('Expo.locationChanged', { watchId, location: positionToJSON(location) });
        },
        null,
        options
      );
      resolve(watchId);
    });
  },
  async requestPermissionsAsync(): Promise<PermissionResult> {
    return new Promise<PermissionResult>(resolve => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ status: 'granted' }),
        ({ code }) => {
          if (code === 1 /* PERMISSION_DENIED */) {
            resolve({ status: 'denied' });
          } else {
            resolve({ status: 'undetermined' });
          }
        }
      );
    });
  },
};
