import { Platform, CodedError } from '@unimodules/core';
import { PermissionStatus } from 'unimodules-permissions-interface';
import ExpoLocation from './ExpoLocation';
import { LocationAccuracy, } from './Location.types';
import { LocationEventEmitter } from './LocationEventEmitter';
import { LocationSubscriber, HeadingSubscriber, _getCurrentWatchId } from './LocationSubscribers';
let googleApiKey;
const googleApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
export async function getProviderStatusAsync() {
    return ExpoLocation.getProviderStatusAsync();
}
export async function enableNetworkProviderAsync() {
    // If network provider is disabled (user's location mode is set to "Device only"),
    // Android's location provider may not give you any results. Use this method in order to ask the user
    // to change the location mode to "High accuracy" which uses Google Play services and enables network provider.
    // `getCurrentPositionAsync` and `watchPositionAsync` are doing it automatically anyway.
    if (Platform.OS === 'android') {
        return ExpoLocation.enableNetworkProviderAsync();
    }
}
/**
 * Requests for one-time delivery of the user's current location.
 * Depending on given `accuracy` option it may take some time to resolve,
 * especially when you're inside a building.
 */
export async function getCurrentPositionAsync(options = {}) {
    return ExpoLocation.getCurrentPositionAsync(options);
}
/**
 * Gets the last known position of the device or `null` if it's not available
 * or doesn't match given requirements such as maximum age or required accuracy.
 * It's considered to be faster than `getCurrentPositionAsync` as it doesn't request for the current location.
 */
export async function getLastKnownPositionAsync(options = {}) {
    return ExpoLocation.getLastKnownPositionAsync(options);
}
/**
 * Starts watching for location changes.
 * Given callback will be called once the new location is available.
 */
export async function watchPositionAsync(options, callback) {
    const watchId = LocationSubscriber.registerCallback(callback);
    await ExpoLocation.watchPositionImplAsync(watchId, options);
    return {
        remove() {
            LocationSubscriber.unregisterCallback(watchId);
        },
    };
}
/**
 * Resolves to an object with current heading details.
 * To simplify, it calls `watchHeadingAsync` and waits for a couple of updates
 * and returns the one that is accurate enough.
 */
export async function getHeadingAsync() {
    return new Promise(async (resolve) => {
        let tries = 0;
        const subscription = await watchHeadingAsync(heading => {
            if (heading.accuracy > 1 || tries > 5) {
                subscription.remove();
                resolve(heading);
            }
            else {
                tries += 1;
            }
        });
    });
}
/**
 * Starts watching for heading changes.
 * Given callback will be called once the new heading is available.
 */
export async function watchHeadingAsync(callback) {
    const watchId = HeadingSubscriber.registerCallback(callback);
    await ExpoLocation.watchDeviceHeading(watchId);
    return {
        remove() {
            HeadingSubscriber.unregisterCallback(watchId);
        },
    };
}
export async function geocodeAsync(address) {
    return ExpoLocation.geocodeAsync(address).catch(error => {
        const platformUsesGoogleMaps = Platform.OS === 'android' || Platform.OS === 'web';
        if (platformUsesGoogleMaps && error.code === 'E_NO_GEOCODER') {
            if (!googleApiKey) {
                throw new CodedError(error.code, `${error.message} Please set a Google API Key to use geocoding.`);
            }
            return _googleGeocodeAsync(address);
        }
        throw error;
    });
}
export async function reverseGeocodeAsync(location) {
    if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new TypeError('Location should be an object with number properties `latitude` and `longitude`.');
    }
    return ExpoLocation.reverseGeocodeAsync(location).catch(error => {
        const platformUsesGoogleMaps = Platform.OS === 'android' || Platform.OS === 'web';
        if (platformUsesGoogleMaps && error.code === 'E_NO_GEOCODER') {
            if (!googleApiKey) {
                throw new CodedError(error.code, `${error.message} Please set a Google API Key to use geocoding.`);
            }
            return _googleReverseGeocodeAsync(location);
        }
        throw error;
    });
}
export function setApiKey(apiKey) {
    googleApiKey = apiKey;
}
async function _googleGeocodeAsync(address) {
    const result = await fetch(`${googleApiUrl}?key=${googleApiKey}&address=${encodeURI(address)}`);
    const resultObject = await result.json();
    if (resultObject.status === 'ZERO_RESULTS') {
        return [];
    }
    assertGeocodeResults(resultObject);
    return resultObject.results.map(result => {
        const location = result.geometry.location;
        // TODO: This is missing a lot of props
        return {
            latitude: location.lat,
            longitude: location.lng,
        };
    });
}
async function _googleReverseGeocodeAsync(options) {
    const result = await fetch(`${googleApiUrl}?key=${googleApiKey}&latlng=${options.latitude},${options.longitude}`);
    const resultObject = await result.json();
    if (resultObject.status === 'ZERO_RESULTS') {
        return [];
    }
    assertGeocodeResults(resultObject);
    return resultObject.results.map(result => {
        const address = {};
        result.address_components.forEach(component => {
            if (component.types.includes('locality')) {
                address.city = component.long_name;
            }
            else if (component.types.includes('street_address')) {
                address.street = component.long_name;
            }
            else if (component.types.includes('administrative_area_level_1')) {
                address.region = component.long_name;
            }
            else if (component.types.includes('country')) {
                address.country = component.long_name;
                address.isoCountryCode = component.short_name;
            }
            else if (component.types.includes('postal_code')) {
                address.postalCode = component.long_name;
            }
            else if (component.types.includes('point_of_interest')) {
                address.name = component.long_name;
            }
        });
        return address;
    });
}
// https://developers.google.com/maps/documentation/geocoding/intro
function assertGeocodeResults(resultObject) {
    const { status, error_message } = resultObject;
    if (status !== 'ZERO_RESULTS' && status !== 'OK') {
        if (error_message) {
            throw new CodedError(status, error_message);
        }
        else if (status === 'UNKNOWN_ERROR') {
            throw new CodedError(status, 'the request could not be processed due to a server error. The request may succeed if you try again.');
        }
        throw new CodedError(status, `An error occurred during geocoding.`);
    }
}
/**
 * Gets the current state of location permissions.
 */
export async function getPermissionsAsync() {
    return await ExpoLocation.getPermissionsAsync();
}
/**
 * Requests the user to grant location permissions.
 */
export async function requestPermissionsAsync() {
    return await ExpoLocation.requestPermissionsAsync();
}
// --- Location service
/**
 * Returns `true` if the device has location services enabled or `false` otherwise.
 */
export async function hasServicesEnabledAsync() {
    return await ExpoLocation.hasServicesEnabledAsync();
}
// --- Background location updates
function _validateTaskName(taskName) {
    if (!taskName || typeof taskName !== 'string') {
        throw new Error(`\`taskName\` must be a non-empty string. Got ${taskName} instead.`);
    }
}
export async function isBackgroundLocationAvailableAsync() {
    const providerStatus = await getProviderStatusAsync();
    return providerStatus.backgroundModeEnabled;
}
export async function startLocationUpdatesAsync(taskName, options = { accuracy: LocationAccuracy.Balanced }) {
    _validateTaskName(taskName);
    await ExpoLocation.startLocationUpdatesAsync(taskName, options);
}
export async function stopLocationUpdatesAsync(taskName) {
    _validateTaskName(taskName);
    await ExpoLocation.stopLocationUpdatesAsync(taskName);
}
export async function hasStartedLocationUpdatesAsync(taskName) {
    _validateTaskName(taskName);
    return ExpoLocation.hasStartedLocationUpdatesAsync(taskName);
}
// --- Geofencing
function _validateRegions(regions) {
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
export async function startGeofencingAsync(taskName, regions = []) {
    _validateTaskName(taskName);
    _validateRegions(regions);
    await ExpoLocation.startGeofencingAsync(taskName, { regions });
}
export async function stopGeofencingAsync(taskName) {
    _validateTaskName(taskName);
    await ExpoLocation.stopGeofencingAsync(taskName);
}
export async function hasStartedGeofencingAsync(taskName) {
    _validateTaskName(taskName);
    return ExpoLocation.hasStartedGeofencingAsync(taskName);
}
export { 
// For internal purposes
LocationEventEmitter as EventEmitter, _getCurrentWatchId, LocationAccuracy as Accuracy, PermissionStatus, };
export { installWebGeolocationPolyfill } from './GeolocationPolyfill';
export * from './Location.types';
//# sourceMappingURL=Location.js.map