// @flow

import { EventEmitter } from 'expo-core';

const emitter = new EventEmitter();

function positionToJSON(position): Object {
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
  async getCurrentPositionAsync(options: Object): Promise {
    return new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(props => res(positionToJSON(props)), rej, options)
    );
  },
  async removeWatchAsync(watchId): Promise<void> {
    navigator.geolocation.clearWatch(watchId);
  },
  async watchDeviceHeading(headingId): Promise<void> {
    console.warn('Location.watchDeviceHeading: is not supported on web');
  },
  async watchPositionImplAsync(watchId: string, options: Object): Promise<any> {
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
