import { PermissionStatus, PermissionResponse, PermissionHookOptions } from 'expo-modules-core';
import { LocationAccuracy, LocationCallback, LocationGeocodedAddress, LocationGeocodedLocation, LocationHeadingCallback, LocationHeadingObject, LocationLastKnownOptions, LocationObject, LocationOptions, LocationPermissionResponse, LocationProviderStatus, LocationRegion, LocationSubscription, LocationTaskOptions, LocationActivityType, LocationGeofencingEventType, LocationGeofencingRegionState, LocationGeocodingOptions } from './Location.types';
import { LocationEventEmitter } from './LocationEventEmitter';
import { _getCurrentWatchId } from './LocationSubscribers';
/**
 * @deprecated The Geocoding web api is no longer available from SDK 49 onwards. Use [Place Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete) instead.
 * @param apiKey Google API key obtained from Google API Console. This API key must have `Geocoding API`
 * enabled, otherwise your geocoding requests will be denied.
 */
declare function setGoogleApiKey(_apiKey: string): void;
/**
 * Check status of location providers.
 * @return A promise which fulfills with an object of type [LocationProviderStatus](#locationproviderstatus).
 */
export declare function getProviderStatusAsync(): Promise<LocationProviderStatus>;
/**
 * Asks the user to turn on high accuracy location mode which enables network provider that uses
 * Google Play services to improve location accuracy and location-based services.
 * @return A promise resolving as soon as the user accepts the dialog. Rejects if denied.
 */
export declare function enableNetworkProviderAsync(): Promise<void>;
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
export declare function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationObject>;
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
export declare function getLastKnownPositionAsync(options?: LocationLastKnownOptions): Promise<LocationObject | null>;
/**
 * Subscribe to location updates from the device. Please note that updates will only occur while the
 * application is in the foreground. To get location updates while in background you'll need to use
 * [Location.startLocationUpdatesAsync](#locationstartlocationupdatesasynctaskname-options).
 * @param options
 * @param callback This function is called on each location update. It receives an object of type
 * [`LocationObject`](#locationobject) as the first argument.
 * @return A promise which fulfills with a [`LocationSubscription`](#locationsubscription) object.
 */
export declare function watchPositionAsync(options: LocationOptions, callback: LocationCallback): Promise<LocationSubscription>;
/**
 * Gets the current heading information from the device. To simplify, it calls `watchHeadingAsync`
 * and waits for a couple of updates, and then returns the one that is accurate enough.
 * @return A promise which fulfills with an object of type [LocationHeadingObject](#locationheadingobject).
 */
export declare function getHeadingAsync(): Promise<LocationHeadingObject>;
/**
 * Subscribe to compass updates from the device.
 * @param callback This function is called on each compass update. It receives an object of type
 * [LocationHeadingObject](#locationheadingobject) as the first argument.
 * @return A promise which fulfills with a [`LocationSubscription`](#locationsubscription) object.
 */
export declare function watchHeadingAsync(callback: LocationHeadingCallback): Promise<LocationSubscription>;
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
export declare function geocodeAsync(address: string, options?: LocationGeocodingOptions): Promise<LocationGeocodedLocation[]>;
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
export declare function reverseGeocodeAsync(location: Pick<LocationGeocodedLocation, 'latitude' | 'longitude'>, options?: LocationGeocodingOptions): Promise<LocationGeocodedAddress[]>;
/**
 * Checks user's permissions for accessing location.
 * @return A promise that fulfills with an object of type [LocationPermissionResponse](#locationpermissionresponse).
 * @deprecated Use [`getForegroundPermissionsAsync`](#locationgetforegroundpermissionsasync) or [`getBackgroundPermissionsAsync`](#locationgetbackgroundpermissionsasync) instead.
 */
export declare function getPermissionsAsync(): Promise<LocationPermissionResponse>;
/**
 * Asks the user to grant permissions for location.
 * @return A promise that fulfills with an object of type [LocationPermissionResponse](#locationpermissionresponse).
 * @deprecated Use [`requestForegroundPermissionsAsync`](#locationrequestforegroundpermissionsasync) or [`requestBackgroundPermissionsAsync`](#locationrequestbackgroundpermissionsasync) instead.
 */
export declare function requestPermissionsAsync(): Promise<LocationPermissionResponse>;
/**
 * Checks user's permissions for accessing location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export declare function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
/**
 * Asks the user to grant permissions for location while the app is in the foreground.
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export declare function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
/**
 * Check or request permissions for the foreground location.
 * This uses both `requestForegroundPermissionsAsync` and `getForegroundPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Location.useForegroundPermissions();
 * ```
 */
export declare const useForegroundPermissions: (options?: PermissionHookOptions<object> | undefined) => [LocationPermissionResponse | null, () => Promise<LocationPermissionResponse>, () => Promise<LocationPermissionResponse>];
/**
 * Checks user's permissions for accessing location while the app is in the background.
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export declare function getBackgroundPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for location while the app is in the background.
 * On __Android 11 or higher__: this method will open the system settings page - before that happens
 * you should explain to the user why your application needs background location permission.
 * For example, you can use `Modal` component from `react-native` to do that.
 * > __Note__: Foreground permissions should be granted before asking for the background permissions
 * (your app can't obtain background permission without foreground permission).
 * @return A promise that fulfills with an object of type [PermissionResponse](#permissionresponse).
 */
export declare function requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
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
export declare const useBackgroundPermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Checks whether location services are enabled by the user.
 * @return A promise which fulfills to `true` if location services are enabled on the device,
 * or `false` if not.
 */
export declare function hasServicesEnabledAsync(): Promise<boolean>;
export declare function isBackgroundLocationAvailableAsync(): Promise<boolean>;
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
export declare function startLocationUpdatesAsync(taskName: string, options?: LocationTaskOptions): Promise<void>;
/**
 * Stops geofencing for specified task.
 * @param taskName Name of the background location task to stop.
 * @return A promise resolving as soon as the task is unregistered.
 */
export declare function stopLocationUpdatesAsync(taskName: string): Promise<void>;
/**
 * @param taskName Name of the location task to check.
 * @return A promise which fulfills with boolean value indicating whether the location task is
 * started or not.
 */
export declare function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
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
export declare function startGeofencingAsync(taskName: string, regions?: LocationRegion[]): Promise<void>;
/**
 * Stops geofencing for specified task. It unregisters the background task so the app will not be
 * receiving any updates, especially in the background.
 * @param taskName Name of the task to unregister.
 * @return A promise resolving as soon as the task is unregistered.
 */
export declare function stopGeofencingAsync(taskName: string): Promise<void>;
/**
 * @param taskName Name of the geofencing task to check.
 * @return A promise which fulfills with boolean value indicating whether the geofencing task is
 * started or not.
 */
export declare function hasStartedGeofencingAsync(taskName: string): Promise<boolean>;
export { LocationEventEmitter as EventEmitter, _getCurrentWatchId };
export { LocationAccuracy as Accuracy, LocationActivityType as ActivityType, LocationGeofencingEventType as GeofencingEventType, LocationGeofencingRegionState as GeofencingRegionState, PermissionStatus, PermissionHookOptions, setGoogleApiKey, };
export { installWebGeolocationPolyfill } from './GeolocationPolyfill';
export * from './Location.types';
//# sourceMappingURL=Location.d.ts.map