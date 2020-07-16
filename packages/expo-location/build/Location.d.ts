import { PermissionStatus } from 'unimodules-permissions-interface';
import { LocationAccuracy, LocationCallback, LocationData, LocationGeocodedAddress, LocationGeocodedLocation, LocationHeadingCallback, LocationHeadingData, LocationLastKnownOptions, LocationOptions, LocationProviderStatus, LocationRegion, LocationTaskOptions, LocationSubscription, PermissionResponse } from './Location.types';
import { LocationEventEmitter } from './LocationEventEmitter';
import { _getCurrentWatchId } from './LocationSubscribers';
export declare function getProviderStatusAsync(): Promise<LocationProviderStatus>;
export declare function enableNetworkProviderAsync(): Promise<void>;
/**
 * Requests for one-time delivery of the user's current location.
 * Depending on given `accuracy` option it may take some time to resolve,
 * especially when you're inside a building.
 */
export declare function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationData>;
/**
 * Gets the last known position of the device or `null` if it's not available
 * or doesn't match given requirements such as maximum age or required accuracy.
 * It's considered to be faster than `getCurrentPositionAsync` as it doesn't request for the current location.
 */
export declare function getLastKnownPositionAsync(options?: LocationLastKnownOptions): Promise<LocationData | null>;
/**
 * Starts watching for location changes.
 * Given callback will be called once the new location is available.
 */
export declare function watchPositionAsync(options: LocationOptions, callback: LocationCallback): Promise<{
    remove(): void;
}>;
/**
 * Resolves to an object with current heading details.
 * To simplify, it calls `watchHeadingAsync` and waits for a couple of updates
 * and returns the one that is accurate enough.
 */
export declare function getHeadingAsync(): Promise<LocationHeadingData>;
/**
 * Starts watching for heading changes.
 * Given callback will be called once the new heading is available.
 */
export declare function watchHeadingAsync(callback: LocationHeadingCallback): Promise<LocationSubscription>;
export declare function geocodeAsync(address: string): Promise<LocationGeocodedLocation[]>;
export declare function reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
}): Promise<LocationGeocodedAddress[]>;
export declare function setApiKey(apiKey: string): void;
/**
 * Gets the current state of location permissions.
 */
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Requests the user to grant location permissions.
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Returns `true` if the device has location services enabled or `false` otherwise.
 */
export declare function hasServicesEnabledAsync(): Promise<boolean>;
export declare function isBackgroundLocationAvailableAsync(): Promise<boolean>;
export declare function startLocationUpdatesAsync(taskName: string, options?: LocationTaskOptions): Promise<void>;
export declare function stopLocationUpdatesAsync(taskName: string): Promise<void>;
export declare function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
export declare function startGeofencingAsync(taskName: string, regions?: LocationRegion[]): Promise<void>;
export declare function stopGeofencingAsync(taskName: string): Promise<void>;
export declare function hasStartedGeofencingAsync(taskName: string): Promise<boolean>;
export { LocationEventEmitter as EventEmitter, _getCurrentWatchId, LocationAccuracy as Accuracy, PermissionStatus, };
export { installWebGeolocationPolyfill } from './GeolocationPolyfill';
export * from './Location.types';
