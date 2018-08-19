// @flow
import invariant from 'invariant';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

import { Permissions } from 'expo-permissions';

const LocationEventEmitter = new NativeEventEmitter(NativeModules.ExponentLocation);

type ProviderStatus = {
  locationServicesEnabled: boolean,
  gpsAvailable: ?boolean,
  networkAvailable: ?boolean,
  passiveAvailable: ?boolean,
};

type LocationOptions = {
  enableHighAccuracy?: boolean,
  timeInterval?: number,
  distanceInterval?: number,
};

type LocationData = {
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

type HeadingData = {
  trueHeading: number,
  magHeading: number,
  accuracy: number,
};

type LocationCallback = (data: LocationData) => any;
type HeadingCallback = (data: HeadingData) => any;

const { ExponentLocation } = NativeModules;

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
let deviceEventSubscription: ?Function;
let headingEventSub: ?Function;
let googleApiKey;
const googleApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

function getProviderStatusAsync(): Promise<ProviderStatus> {
  return ExponentLocation.getProviderStatusAsync();
}

function getCurrentPositionAsync(options: LocationOptions = {}): Promise<LocationData> {
  // On Android we have a native method for this case.
  if (Platform.OS === 'android') {
    return ExponentLocation.getCurrentPositionAsync(options);
  }

  // On iOS we implement it in terms of `.watchPositionAsync(...)`
  // TODO: Use separate native method for iOS too?
  return new Promise(async (resolve, reject) => {
    try {
      let done = false; // To make sure we only resolve once.
      let subscription;
      subscription = await watchPositionAsync(options, location => {
        if (!done) {
          resolve(location);
          done = true;
        }
        subscription && subscription.remove();
        subscription = null;
      });

      // In case the callback is fired before we get here.
      if (done) {
        subscription && subscription.remove();
        subscription = null;
      }
    } catch (e) {
      reject(e);
    }
  });
}

// Start Compass Module

// To simplify, we will call watchHeadingAsync and wait for one update To ensure accuracy, we wait
// for a couple of watch updates if the data has low accuracy
async function getHeadingAsync() {
  return new Promise(async (resolve, reject) => {
    try {
      // If there is already a compass active (would be a watch)
      if (headingEventSub) {
        let tries = 0;
        const headingSub = LocationEventEmitter.addListener(
          'Exponent.headingChanged',
          ({ watchId, heading }) => {
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
        subscription = await watchHeadingAsync(heading => {
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

async function watchHeadingAsync(callback: HeadingCallback) {
  // Check if there is already a compass event watch.
  if (headingEventSub) {
    _removeHeadingWatcher(headingId);
  }

  headingEventSub = LocationEventEmitter.addListener(
    'Exponent.headingChanged',
    ({ watchId, heading }) => {
      const callback = watchCallbacks[watchId];
      if (callback) {
        callback(heading);
      } else {
        ExponentLocation.removeWatchAsync(watchId);
      }
    }
  );

  headingId = _getNextWatchId();
  watchCallbacks[headingId] = callback;
  await ExponentLocation.watchDeviceHeading(headingId);
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
  ExponentLocation.removeWatchAsync(watchId);
  LocationEventEmitter.removeSubscription(headingEventSub);
  headingEventSub = null;
}
// End Compass Module

function _maybeInitializeEmitterSubscription() {
  if (!deviceEventSubscription) {
    deviceEventSubscription = LocationEventEmitter.addListener(
      'Exponent.locationChanged',
      ({ watchId, location }) => {
        const callback = watchCallbacks[watchId];
        if (callback) {
          callback(location);
        } else {
          ExponentLocation.removeWatchAsync(watchId);
        }
      }
    );
  }
}

async function _askPermissionForWatchAsync(success, error, options, watchId) {
  let { status } = await Permissions.askAsync(Permissions.LOCATION);
  if (status === 'granted') {
    ExponentLocation.watchPositionImplAsync(watchId, options);
  } else {
    _removeWatcher(watchId);
    error({ watchId, message: 'No permission to access location' });
  }
}

async function geocodeAsync(address: string) {
  return ExponentLocation.geocodeAsync(address).catch(error => {
    if (Platform.OS === 'android' && error.code === 'E_NO_GEOCODER') {
      if (!googleApiKey) {
        throw new Error(error.message + ' Please set a Google API Key to use geocoding.');
      }
      return _googleGeocodeAsync(address);
    }
    throw error;
  });
}

async function reverseGeocodeAsync(location: { latitude: number, longitude: number }) {
  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    throw new TypeError(
      'Location should be an object with number properties `latitude` and `longitude`.'
    );
  }
  return ExponentLocation.reverseGeocodeAsync(location).catch(error => {
    if (Platform.OS === 'android' && error.code === 'E_NO_GEOCODER') {
      if (!googleApiKey) {
        throw new Error(error.message + ' Please set a Google API Key to use geocoding.');
      }
      return _googleReverseGeocodeAsync(location);
    }
    throw error;
  });
}

function setApiKey(apiKey: string) {
  googleApiKey = apiKey;
}

async function _googleGeocodeAsync(address: string) {
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

async function _googleReverseGeocodeAsync(options: { latitude: number, longitude: number }) {
  const result = await fetch(
    `${googleApiUrl}?key=${googleApiKey}&latlng=${options.latitude},${options.longitude}`
  );
  const resultObject = await result.json();

  if (resultObject.status !== 'OK') {
    throw new Error('An error occurred during geocoding.');
  }

  return resultObject.results.map(result => {
    let address = {};
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
    return address;
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
  _askPermissionForWatchAsync(success, error, options, watchId);

  return watchId;
}

async function watchPositionAsync(options: LocationOptions, callback: LocationCallback) {
  _maybeInitializeEmitterSubscription();

  const watchId = _getNextWatchId();
  watchCallbacks[watchId] = callback;
  await ExponentLocation.watchPositionImplAsync(watchId, options);

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

  ExponentLocation.removeWatchAsync(watchId);
  delete watchCallbacks[watchId];
  if (Object.keys(watchCallbacks).length === 0) {
    LocationEventEmitter.removeSubscription(deviceEventSubscription);
    deviceEventSubscription = null;
  }
}

type GeoSuccessCallback = (data: LocationData) => void;
type GeoErrorCallback = (error: any) => void;

function getCurrentPosition(
  success: GeoSuccessCallback,
  error?: GeoErrorCallback = () => {},
  options?: LocationOptions = {}
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
): Promise<*> {
  try {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      throw new Error(
        'Permission to access location not granted. User must now enable it manually in settings'
      );
    }

    let result = await Location.getCurrentPositionAsync(options);
    success(result);
  } catch (e) {
    error(e);
  }
}

// Polyfill navigator.geolocation for interop with the core react-native and web API approach to
// geolocation
window.navigator.geolocation = {
  getCurrentPosition,
  watchPosition,
  clearWatch,

  // We don't polyfill stopObserving, this is an internal method that probably should not even exist
  // in react-native docs
  stopObserving: () => {},
};

const Location = {
  getProviderStatusAsync,
  getCurrentPositionAsync,
  watchPositionAsync,
  getHeadingAsync,
  watchHeadingAsync,
  geocodeAsync,
  reverseGeocodeAsync,
  setApiKey,

  // For internal purposes
  EventEmitter: LocationEventEmitter,
  _getCurrentWatchId,
};

export default Location;
