import { PermissionStatus, createPermissionHook, Platform, } from 'expo-modules-core';
import ExpoLocation from './ExpoLocation';
import { LocationAccuracy, LocationActivityType, LocationGeofencingEventType, LocationGeofencingRegionState, } from './Location.types';
import { LocationEventEmitter } from './LocationEventEmitter';
import { LocationSubscriber, HeadingSubscriber, _getCurrentWatchId } from './LocationSubscribers';
// @needsAudit
/**
 * @deprecated The Geocoding web api is no longer available from SDK 49 onwards. Use [Place Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete) instead.
 * @param apiKey Google API key obtained from Google API Console. This API key must have `Geocoding API`
 * enabled, otherwise your geocoding requests will be denied.
 */
function setGoogleApiKey(_apiKey) { }
// @needsAudit
/**
 * Check status of location providers.
 * @return A promise which fulfills with an object of type [LocationProviderStatus](#locationproviderstatus).
 */
export async function getProviderStatusAsync() {
    return ExpoLocation.getProviderStatusAsync();
}
// @needsAudit
/**
 * Asks the user to turn on high accuracy location mode which enables network provider that uses
 * Google Play services to improve location accuracy and location-based services.
 * @return A promise resolving as soon as the user accepts the dialog. Rejects if denied.
 */
export async function enableNetworkProviderAsync() {
    // If network provider is disabled (user's location mode is set to "Device only"),
    // Android's location provider may not give you any results. Use this method in order to ask the user
    // to change the location mode to "High accuracy" which uses Google Play services and enables network provider.
    // `getCurrentPositionAsync` and `watchPositionAsync` are doing it automatically anyway.
    if (Platform.OS === 'android') {
        return ExpoLocation.enableNetworkProviderAsync();
    }
}
// @needsAudit
/**
 * Requests for one-time delivery of the user's current location.
 * Depending on given `accuracy` option it may take some time to resolve,
 * especially when you're inside a building.
 * > __Note:__ Calling it causes the location manager to obtain a location fix which may take several
 * > seconds. Consider using [`Location.getLastKnownPositionAsync`](#locationgetlastknownpositionasyncoptions)
 * > if you expect to get a quick response and high accuracy is not required.
 * @param options
 * @return A promise which fulfills with an object of type [`LocationObject`](#locationobject).
 */
export async function getCurrentPositionAsync(options = {}) {
    return ExpoLocation.getCurrentPositionAsync(options);
}
// @needsAudit
/**
 * Gets the last known position of the device or `null` if it's not available or doesn't match given
 * requirements such as maximum age or required accuracy.
 * It's considered to be faster than `getCurrentPositionAsync` as it doesn't request for the current
 * location, but keep in mind the returned location may not be up-to-date.
 * @param options
 * @return A promise which fulfills with an object of type [LocationObject](#locationobject) or
 * `null` if it's not available or doesn't match given requirements such as maximum age or required
 * accuracy.
 */
export async function getLastKnownPositionAsync(options = {}) {
    return ExpoLocation.getLastKnownPositionAsync(options);
}
// @needsAudit
/**
 * Subscribe to location updates from the device. Please note that updates will only occur while the
 * application is in the foreground. To get location updates while in background you'll need to use
 * [Location.startLocationUpdatesAsync](#locationstartlocationupdatesasynctaskname-options).
 * @param options
 * @param callback This function is called on each location update. It receives an object of type
 * [`LocationObject`](#locationobject) as the first argument.
 * @return A promise which fulfills with a [`LocationSubscription`](#locationsubscription) object.
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
// @needsAudit
/**
 * Gets the current heading information from the device. To simplify, it calls `watchHeadingAsync`
 * and waits for a couple of updates, and then returns the one that is accurate enough.
 * @return A promise which fulfills with an object of type [LocationHeadingObject](#locationheadingobject).
 */
export async function getHeadingAsync() {
    return new Promise(async (resolve) => {
        let tries = 0;
        const subscription = await watchHeadingAsync((heading) => {
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
// @needsAudit
/**
 * Subscribe to compass updates from the device.
 * @param callback This function is called on each compass update. It receives an object of type
 * [LocationHeadingObject](#locationheadingobject) as the first argument.
 * @return A promise which fulfills with a [`LocationSubscription`](#locationsubscription) object.
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
// @needsAudit
/**
 * Geocode an address string to latitude-longitude location.
 * > **Note**: Using the Geocoding web api is no longer supported. Use [Place Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete) instead.
 *
 * > **Note**: Geocoding is resource consuming and has to be used reasonably. Creating too many
 * > requests at a time can result in an error, so they have to be managed properly.
 * > It's also discouraged to use geocoding while the app is in the background and its results won't
 * > be shown to the user immediately.
 *
 * > On Android, you must request a location permission (`Permissions.LOCATION`) from the user
 * > before geocoding can be used.
 * @param address A string representing address, eg. `"Baker Street London"`.
 * @param options
 * @return A promise which fulfills with an array (in most cases its size is 1) of [`LocationGeocodedLocation`](#locationgeocodedlocation) objects.
 */
export async function geocodeAsync(address, options) {
    if (typeof address !== 'string') {
        throw new TypeError(`Address to geocode must be a string. Got ${address} instead.`);
    }
    if (options?.useGoogleMaps || Platform.OS === 'web') {
        if (__DEV__) {
            console.warn('The Geocoding API has been removed in SDK 49, use Place Autocomplete service instead' +
                '(https://developers.google.com/maps/documentation/places/web-service/autocomplete)');
        }
        return [];
    }
    return await ExpoLocation.geocodeAsync(address);
}
// @needsAudit
/**
 * Reverse geocode a location to postal address.
 * > **Note**: Using the Geocoding web api is no longer supported. Use [Place Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete) instead.
 *
 * > **Note**: Geocoding is resource consuming and has to be used reasonably. Creating too many
 * > requests at a time can result in an error, so they have to be managed properly.
 * > It's also discouraged to use geocoding while the app is in the background and its results won't
 * > be shown to the user immediately.
 *
 * > On Android, you must request a location permission (`Permissions.LOCATION`) from the user
 * > before geocoding can be used.
 * @param location An object representing a location.
 * @param options
 * @return A promise which fulfills with an array (in most cases its size is 1) of [`LocationGeocodedAddress`](#locationgeocodedaddress) objects.
 */
export async function reverseGeocodeAsync(location, options) {
    if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new TypeError('Location to reverse-geocode must be an object with number properties `latitude` and `longitude`.');
    }
    if (options?.useGoogleMaps || Platform.OS === 'web') {
        if (__DEV__) {
            console.warn('The Geocoding API has been removed in SDK 49, use Place Autocomplete service instead' +
                '(https://developers.google.com/maps/documentation/places/web-service/autocomplete)');
        }
        return [];
    }
    return await ExpoLocation.reverseGeocodeAsync(location);
}
// @needsAudit
/**
 * Checks user's permissions for accessing location.
 * @return A promise that fulfills with an object of type [LocationPermissionResponse](#locationpermissionresponse).
 * @deprecated Use [`getForegroundPermissionsAsync`](#locationgetforegroundpermissionsasync) or [`getBackgroundPermissionsAsync`](#locationgetbackgroundpermissionsasync) instead.
 */
export async function getPermissionsAsync() {
    console.warn(`"getPermissionsAsync()" is now deprecated. Please use "getForegroundPermissionsAsync()" or "getBackgroundPermissionsAsync()" instead.`);
    return await ExpoLocation.getPermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for location.
 * @return A promise that fulfills with an object of type [LocationPermissionResponse](#locationpermissionresponse).
 * @deprecated Use [`requestForegroundPermissionsAsync`](#locationrequestforegroundpermissionsasync) or [`requestBackgroundPermissionsAsync`](#locationrequestbackgroundpermissionsasync) instead.
 */
export async function requestPermissionsAsync() {
    console.warn(`"requestPermissionsAsync()" is now deprecated. Please use "requestForegroundPermissionsAsync()" or "requestBackgroundPermissionsAsync()" instead.`);
    return await ExpoLocation.requestPermissionsAsync();
}
// @needsAudit
/**
 * Checks user's permissions for accessing location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export async function getForegroundPermissionsAsync() {
    return await ExpoLocation.getForegroundPermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export async function requestForegroundPermissionsAsync() {
    return await ExpoLocation.requestForegroundPermissionsAsync();
}
// @needsAudit
/**
 * Check or request permissions for the foreground location.
 * This uses both `requestForegroundPermissionsAsync` and `getForegroundPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Location.useForegroundPermissions();
 * ```
 */
export const useForegroundPermissions = createPermissionHook({
    getMethod: getForegroundPermissionsAsync,
    requestMethod: requestForegroundPermissionsAsync,
});
// @needsAudit
/**
 * Checks user's permissions for accessing location while the app is in the background.
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export async function getBackgroundPermissionsAsync() {
    return await ExpoLocation.getBackgroundPermissionsAsync();
}
// @needsAudit
/**
 * Asks the user to grant permissions for location while the app is in the background.
 * On __Android 11 or higher__: this method will open the system settings page - before that happens
 * you should explain to the user why your application needs background location permission.
 * For example, you can use `Modal` component from `react-native` to do that.
 * > __Note__: Foreground permissions should be granted before asking for the background permissions
 * (your app can't obtain background permission without foreground permission).
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export async function requestBackgroundPermissionsAsync() {
    return await ExpoLocation.requestBackgroundPermissionsAsync();
}
// @needsAudit
/**
 * Check or request permissions for the background location.
 * This uses both `requestBackgroundPermissionsAsync` and `getBackgroundPermissionsAsync` to
 * interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Location.useBackgroundPermissions();
 * ```
 */
export const useBackgroundPermissions = createPermissionHook({
    getMethod: getBackgroundPermissionsAsync,
    requestMethod: requestBackgroundPermissionsAsync,
});
// --- Location service
// @needsAudit
/**
 * Checks whether location services are enabled by the user.
 * @return A promise which fulfills to `true` if location services are enabled on the device,
 * or `false` if not.
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
// @docsMissing
export async function isBackgroundLocationAvailableAsync() {
    const providerStatus = await getProviderStatusAsync();
    return providerStatus.backgroundModeEnabled;
}
// @needsAudit
/**
 * Registers for receiving location updates that can also come when the app is in the background.
 *
 * # Task parameters
 *
 * Background location task will be receiving following data:
 * - `locations` - An array of the new locations.
 *
 * ```ts
 * import * as TaskManager from 'expo-task-manager';
 *
 * TaskManager.defineTask(YOUR_TASK_NAME, ({ data: { locations }, error }) => {
 *  if (error) {
 *    // check `error.message` for more details.
 *    return;
 *  }
 *  console.log('Received new locations', locations);
 * });
 * ```
 *
 * @param taskName Name of the task receiving location updates.
 * @param options An object of options passed to the location manager.
 *
 * @return A promise resolving once the task with location updates is registered.
 */
export async function startLocationUpdatesAsync(taskName, options = { accuracy: LocationAccuracy.Balanced }) {
    _validateTaskName(taskName);
    await ExpoLocation.startLocationUpdatesAsync(taskName, options);
}
// @needsAudit
/**
 * Stops geofencing for specified task.
 * @param taskName Name of the background location task to stop.
 * @return A promise resolving as soon as the task is unregistered.
 */
export async function stopLocationUpdatesAsync(taskName) {
    _validateTaskName(taskName);
    await ExpoLocation.stopLocationUpdatesAsync(taskName);
}
// @needsAudit
/**
 * @param taskName Name of the location task to check.
 * @return A promise which fulfills with boolean value indicating whether the location task is
 * started or not.
 */
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
// @needsAudit
/**
 * Starts geofencing for given regions. When the new event comes, the task with specified name will
 * be called with the region that the device enter to or exit from.
 * If you want to add or remove regions from already running geofencing task, you can just call
 * `startGeofencingAsync` again with the new array of regions.
 *
 * # Task parameters
 *
 * Geofencing task will be receiving following data:
 *  - `eventType` - Indicates the reason for calling the task, which can be triggered by entering or exiting the region.
 *    See [GeofencingEventType](#geofencingeventtype).
 *  - `region` - Object containing details about updated region. See [LocationRegion](#locationregion) for more details.
 *
 * @param taskName Name of the task that will be called when the device enters or exits from specified regions.
 * @param regions Array of region objects to be geofenced.
 *
 * @return A promise resolving as soon as the task is registered.
 *
 * @example
 * ```ts
 * import { GeofencingEventType } from 'expo-location';
 * import * as TaskManager from 'expo-task-manager';
 *
 *  TaskManager.defineTask(YOUR_TASK_NAME, ({ data: { eventType, region }, error }) => {
 *   if (error) {
 *     // check `error.message` for more details.
 *     return;
 *   }
 *   if (eventType === GeofencingEventType.Enter) {
 *     console.log("You've entered region:", region);
 *   } else if (eventType === GeofencingEventType.Exit) {
 *     console.log("You've left region:", region);
 *   }
 * });
 * ```
 */
export async function startGeofencingAsync(taskName, regions = []) {
    _validateTaskName(taskName);
    _validateRegions(regions);
    await ExpoLocation.startGeofencingAsync(taskName, { regions });
}
// @needsAudit
/**
 * Stops geofencing for specified task. It unregisters the background task so the app will not be
 * receiving any updates, especially in the background.
 * @param taskName Name of the task to unregister.
 * @return A promise resolving as soon as the task is unregistered.
 */
export async function stopGeofencingAsync(taskName) {
    _validateTaskName(taskName);
    await ExpoLocation.stopGeofencingAsync(taskName);
}
// @needsAudit
/**
 * @param taskName Name of the geofencing task to check.
 * @return A promise which fulfills with boolean value indicating whether the geofencing task is
 * started or not.
 */
export async function hasStartedGeofencingAsync(taskName) {
    _validateTaskName(taskName);
    return ExpoLocation.hasStartedGeofencingAsync(taskName);
}
export { LocationEventEmitter as EventEmitter, _getCurrentWatchId };
export { LocationAccuracy as Accuracy, LocationActivityType as ActivityType, LocationGeofencingEventType as GeofencingEventType, LocationGeofencingRegionState as GeofencingRegionState, PermissionStatus, setGoogleApiKey, };
export { installWebGeolocationPolyfill } from './GeolocationPolyfill';
export * from './Location.types';
//# sourceMappingURL=Location.js.map