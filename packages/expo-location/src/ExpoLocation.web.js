// @flow

import { EventEmitter } from 'expo-core';

type Coordinates = {
  latitude: number,
  longitude: number,
  altitude?: number,
  accuracy?: number,
  altitudeAccuracy?: number,
  heading?: number,
  speed?: number,
};

type Position = {
  coords: Coordinates,
  timestamp: number,
};

class GeocoderError extends Error {
  constructor() {
    super('Geocoder service is not available for this device.');
    this.code = 'E_NO_GEOCODER';
  }
}

const emitter = new EventEmitter();

function positionToJSON(position: ?any): ?Position {
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
  async getCurrentPositionAsync(options: Object): Promise<?Position> {
    return new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(
        position => res(positionToJSON(position)),
        rej,
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
  async geocodeAsync(): Promise<Array> {
    throw new GeocoderError();
  },
  async reverseGeocodeAsync(): Promise<Array> {
    throw new GeocoderError();
  },
  async watchPositionImplAsync(watchId: string, options: Object): Promise<string> {
    return new Promise((res, rej) => {
      watchId = global.navigator.geolocation.watchPosition(
        location => {
          emitter.emit('Exponent.locationChanged', { watchId, location: positionToJSON(location) });
        },
        rej,
        options
      );
      res(watchId);
    });
  },
  async requestPermissionsAsync(): Promise<{ status: string }> {
    return new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(
        () => res({ status: 'granted' }),
        ({ code }) => {
          if (code === 1) {
            res({ status: 'denied' });
          } else {
            res({ status: 'undetermined' });
          }
        }
      );
    });
  },
};
