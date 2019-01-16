import { EventEmitter, Platform } from 'expo-core';
import invariant from 'invariant';

import ExpoLocation from './ExpoLocation';

const LocationEventEmitter = new EventEmitter(ExpoLocation);

interface ProviderStatus {
  locationServicesEnabled: boolean,
  gpsAvailable?: boolean,
  networkAvailable?: boolean,
  passiveAvailable?: boolean,
};

interface LocationOptions {
  accuracy?: LocationAccuracy,
  enableHighAccuracy?: boolean,
  timeInterval?: number,
  distanceInterval?: number,
  timeout?: number,
};

interface LocationData {
  coords: {
    latitude: number,
    longitude: number,
    altitude: number,
    accuracy: number,
    heading: number,
    speed: number,
  },
  timestamp: number,
};

interface HeadingData {
  trueHeading: number,
  magHeading: number,
  accuracy: number,
};

interface GeocodedLocation {
  latitude: number,
  longitude: number,
  altitude?: number,
  accuracy?: number,
};

interface Address {
  city: string,
  street: string,
  region: string,
  country: string,
  postalCode: string,
  name: string,
};

interface LocationTaskOptions {
  accuracy?: LocationAccuracy,
  showsBackgroundLocationIndicator?: boolean,
};

interface Region {
  identifier?: string,
  latitude: number,
  longitude: number,
  radius: number,
  notifyOnEnter?: boolean,
  notifyOnExit?: boolean,
};

type Subscription = {
  remove: () => void,
};
type LocationCallback = (data: LocationData) => any;
type HeadingCallback = (data: HeadingData) => any;

enum LocationAccuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}
export { LocationAccuracy as Accuracy };

export enum GeofencingEventType {
  Enter = 1,
  Exit = 2,
}

export enum GeofencingRegionState {
  Unknown = 0,
  Inside = 1,
  Outside = 2,
}

let nextWatchId = 0;
let headingId;
function _getNextWatchId() {
  nextWatchId++;
  return nextWatchId;
}
function _getCurrentWatchId() {
  return nextWatchId;
}

let watchCallbacks: {
  [watchId: number]: LocationCallback | HeadingCallback,
} = {};

let deviceEventSubscription: Subscription | null;
let headingEventSub: Subscription | null;
let googleApiKey;
const googleApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

export async function getProviderStatusAsync(): Promise<ProviderStatus> {
  return ExpoLocation.getProviderStatusAsync();
}

export async function getCurrentPositionAsync(options: LocationOptions = {}): Promise<LocationData> {
  return ExpoLocation.getCurrentPositionAsync(options);
}

// Start Compass Module

// To simplify, we will call watchHeadingAsync and wait for one update To ensure accuracy, we wait
// for a couple of watch updates if the data has low accuracy
export async function getHeadingAsync(): Promise<HeadingData> {
  return new Promise<HeadingData>(async (resolve, reject) => {
    try {
      // If there is already a compass active (would be a watch)
      if (headingEventSub) {
        let tries = 0;
        const headingSub = LocationEventEmitter.addListener(
          'Exponent.headingChanged',
          ({ heading }: { heading: HeadingData }) => {
            if (heading.accuracy > 1 || tries > 5) {
              resolve(heading);
              LocationEventEmitter.removeSubscription(headingSub);
            } else {
              tries += 1;
            }
          }
        );
      } else {
        let done = false;
        let subscription;
        let tries = 0;
        subscription = await watchHeadingAsync((heading: HeadingData) => {
          if (!done) {
            if (heading.accuracy > 1 || tries > 5) {
              subscription.remove();
              resolve(heading);
              done = true;
            } else {
              tries += 1;
            }
          } else {
            subscription.remove();
          }
        });

        if (done) {
          subscription.remove();
        }
      }
    } catch (e) {
      reject(e);
    }
  });
}

export async function watchHeadingAsync(callback: HeadingCallback): Promise<object> {
  // Check if there is already a compass event watch.
  if (headingEventSub) {
    _removeHeadingWatcher(headingId);
  }

  headingEventSub = LocationEventEmitter.addListener(
    'Exponent.headingChanged',
    ({ watchId, heading }: { watchId: string, heading: HeadingData }) => {
      const callback = watchCallbacks[watchId];
      if (callback) {
        callback(heading);
      } else {
        ExpoLocation.removeWatchAsync(watchId);
      }
    }
  );

  headingId = _getNextWatchId();
  watchCallbacks[headingId] = callback;
  await ExpoLocation.watchDeviceHeading(headingId);
  return {
    remove() {
      _removeHeadingWatcher(headingId);
    },
  };
}

// Removes the compass listener and sub from JS and Native
function _removeHeadingWatcher(watchId) {
  if (!watchCallbacks[watchId]) {
    return;
  }
  delete watchCallbacks[watchId];
  ExpoLocation.removeWatchAsync(watchId);
  if (headingEventSub) {
    LocationEventEmitter.removeSubscription(headingEventSub);
    headingEventSub = null;
  }
}
// End Compass Module

function _maybeInitializeEmitterSubscription() {
  if (!deviceEventSubscription) {
    deviceEventSubscription = LocationEventEmitter.addListener(
      'Exponent.locationChanged',
      ({ watchId, location }: { watchId: string, location: LocationData }) => {
        const callback = watchCallbacks[watchId];
        if (callback) {
          callback(location);
        } else {
          ExpoLocation.removeWatchAsync(watchId);
        }
      }
    );
  }
}

export async function geocodeAsync(address: string): Promise<Array<GeocodedLocation>> {
  return ExpoLocation.geocodeAsync(address).catch(error => {
    const platformUsesGoogleMaps = Platform.OS === 'android' || Platform.OS === 'web';

    if (platformUsesGoogleMaps && error.code === 'E_NO_GEOCODER') {
      if (!googleApiKey) {
        throw new Error(error.message + ' Please set a Google API Key to use geocoding.');
      }
      return _googleGeocodeAsync(address);
    }
    throw error;
  });
}

export async function reverseGeocodeAsync(location: { latitude: number, longitude: number }): Promise<Address[]> {
  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    throw new TypeError(
      'Location should be an object with number properties `latitude` and `longitude`.'
    );
  }
  return ExpoLocation.reverseGeocodeAsync(location).catch(error => {
    const platformUsesGoogleMaps = Platform.OS === 'android' || Platform.OS === 'web';

    if (platformUsesGoogleMaps && error.code === 'E_NO_GEOCODER') {
      if (!googleApiKey) {
        throw new Error(error.message + ' Please set a Google API Key to use geocoding.');
      }
      return _googleReverseGeocodeAsync(location);
    }
    throw error;
  });
}

export function setApiKey(apiKey: string) {
  googleApiKey = apiKey;
}

async function _googleGeocodeAsync(address: string): Promise<GeocodedLocation[]> {
  const result = await fetch(`${googleApiUrl}?key=${googleApiKey}&address=${encodeURI(address)}`);
  const resultObject = await result.json();

  if (resultObject.status !== 'OK') {
    throw new Error('An error occurred during geocoding.');
  }

  return resultObject.results.map(result => {
    let location = result.geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  });
}

async function _googleReverseGeocodeAsync(options: { latitude: number, longitude: number }): Promise<Address[]> {
  const result = await fetch(
    `${googleApiUrl}?key=${googleApiKey}&latlng=${options.latitude},${options.longitude}`
  );
  const resultObject = await result.json();

  if (resultObject.status !== 'OK') {
    throw new Error('An error occurred during geocoding.');
  }

  return resultObject.results.map(result => {
    const address: any = {};

    result.address_components.forEach(component => {
      if (component.types.includes('locality')) {
        address.city = component.long_name;
      } else if (component.types.includes('street_address')) {
        address.street = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        address.region = component.long_name;
      } else if (component.types.includes('country')) {
        address.country = component.long_name;
      } else if (component.types.includes('postal_code')) {
        address.postalCode = component.long_name;
      } else if (component.types.includes('point_of_interest')) {
        address.name = component.long_name;
      }
    });
    return address as Address;
  });
}

// Polyfill: navigator.geolocation.watchPosition
function watchPosition(
  success: GeoSuccessCallback,
  error: GeoErrorCallback,
  options: LocationOptions
) {
  _maybeInitializeEmitterSubscription();

  const watchId = _getNextWatchId();
  watchCallbacks[watchId] = success;

  ExpoLocation.watchPositionImplAsync(watchId, options).catch(err => {
    _removeWatcher(watchId);
    error({ watchId, message: err.message, code: err.code });
  });

  return watchId;
}

export async function watchPositionAsync(options: LocationOptions, callback: LocationCallback) {
  _maybeInitializeEmitterSubscription();

  const watchId = _getNextWatchId();
  watchCallbacks[watchId] = callback;
  await ExpoLocation.watchPositionImplAsync(watchId, options);

  return {
    remove() {
      _removeWatcher(watchId);
    },
  };
}

// Polyfill: navigator.geolocation.clearWatch
function clearWatch(watchId: number) {
  _removeWatcher(watchId);
}

function _removeWatcher(watchId) {
  // Do nothing if we have already removed the subscription
  if (!watchCallbacks[watchId]) {
    return;
  }

  ExpoLocation.removeWatchAsync(watchId);
  delete watchCallbacks[watchId];
  if (Object.keys(watchCallbacks).length === 0 && deviceEventSubscription) {
    LocationEventEmitter.removeSubscription(deviceEventSubscription);
    deviceEventSubscription = null;
  }
}

type GeoSuccessCallback = (data: LocationData) => void;
type GeoErrorCallback = (error: any) => void;

function getCurrentPosition(
  success: GeoSuccessCallback,
  error: GeoErrorCallback = () => {},
  options: LocationOptions = {}
): void {
  invariant(typeof success === 'function', 'Must provide a valid success callback.');

  invariant(typeof options === 'object', 'options must be an object.');

  _getCurrentPositionAsyncWrapper(success, error, options);
}

// This function exists to let us continue to return undefined from getCurrentPosition, while still
// using async/await for the internal implementation of it
async function _getCurrentPositionAsyncWrapper(
  success: GeoSuccessCallback,
  error: GeoErrorCallback,
  options: LocationOptions
): Promise<any> {
  try {
    await ExpoLocation.requestPermissionsAsync();
    const result = await getCurrentPositionAsync(options);
    success(result);
  } catch (e) {
    error(e);
  }
}

export async function requestPermissionsAsync(): Promise<void> {
  await ExpoLocation.requestPermissionsAsync();
}

// --- Location service

export async function hasServicesEnabledAsync(): Promise<boolean> {
  return await ExpoLocation.hasServicesEnabledAsync();
}

// --- Background location updates

function _validateTaskName(taskName: string) {
  invariant(taskName && typeof taskName === 'string', '`taskName` must be a non-empty string.');
}

export async function startLocationUpdatesAsync(
  taskName: string,
  options: LocationTaskOptions = { accuracy: LocationAccuracy.Balanced }
): Promise<void> {
  _validateTaskName(taskName);
  await ExpoLocation.startLocationUpdatesAsync(taskName, options);
}

export async function stopLocationUpdatesAsync(taskName: string): Promise<void> {
  _validateTaskName(taskName);
  await ExpoLocation.stopLocationUpdatesAsync(taskName);
}

export async function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean> {
  _validateTaskName(taskName);
  return ExpoLocation.hasStartedLocationUpdatesAsync(taskName);
}

// --- Geofencing

function _validateRegions(regions: Array<Region>) {
  if (!regions || regions.length === 0) {
    throw new Error('Regions array cannot be empty. Use `stopGeofencingAsync` if you want to stop geofencing all regions');
  }
  for (const region of regions) {
    if (typeof region.latitude !== 'number') {
      throw new TypeError(`Region's latitude must be a number. Got '${region.latitude}' instead.`);
    }
    if (typeof region.longitude !== 'number') {
      throw new TypeError(`Region's longitude must be a number. Got '${region.longitude}' instead.`);
    }
    if (typeof region.radius !== 'number') {
      throw new TypeError(`Region's radius must be a number. Got '${region.radius}' instead.`);
    }
  }
}

export async function startGeofencingAsync(taskName: string, regions: Array<Region> = []): Promise<void> {
  _validateTaskName(taskName);
  _validateRegions(regions);
  await ExpoLocation.startGeofencingAsync(taskName, { regions });
}

export async function stopGeofencingAsync(taskName: string): Promise<void> {
  _validateTaskName(taskName);
  await ExpoLocation.stopGeofencingAsync(taskName);
}

export async function hasStartedGeofencingAsync(taskName: string): Promise<boolean> {
  _validateTaskName(taskName);
  return ExpoLocation.hasStartedGeofencingAsync(taskName);
}

export function installWebGeolocationPolyfill(): void {
  if (Platform.OS !== 'web') {
    // Polyfill navigator.geolocation for interop with the core react-native and web API approach to
    // geolocation
    // @ts-ignore
    window.navigator.geolocation = {
      getCurrentPosition,
      watchPosition,
      clearWatch,

      // We don't polyfill stopObserving, this is an internal method that probably should not even exist
      // in react-native docs
      stopObserving: () => {},
    };
  }
}

export {
  // For internal purposes
  LocationEventEmitter as EventEmitter,
  _getCurrentWatchId,
};
