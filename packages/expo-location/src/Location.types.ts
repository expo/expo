import { PermissionResponse as UMPermissionResponse } from 'expo-modules-core';

// @needsAudit
/**
 * Enum with available location accuracies.
 */
export enum LocationAccuracy {
  /**
   * Accurate to the nearest three kilometers.
   */
  Lowest = 1,
  /**
   * Accurate to the nearest kilometer.
   */
  Low = 2,
  /**
   * Accurate to within one hundred meters.
   */
  Balanced = 3,
  /**
   * Accurate to within ten meters of the desired target.
   */
  High = 4,
  /**
   * The best level of accuracy available.
   */
  Highest = 5,
  /**
   * The highest possible accuracy that uses additional sensor data to facilitate navigation apps.
   */
  BestForNavigation = 6,
}

// @needsAudit
/**
 * Enum with available activity types of background location tracking.
 */
export enum LocationActivityType {
  /**
   * Default activity type. Use it if there is no other type that matches the activity you track.
   */
  Other = 1,
  /**
   * Location updates are being used specifically during vehicular navigation to track location
   * changes to the automobile.
   */
  AutomotiveNavigation = 2,
  /**
   * Use this activity type if you track fitness activities such as walking, running, cycling,
   * and so on.
   */
  Fitness = 3,
  /**
   * Activity type for movements for other types of vehicular navigation that are not automobile
   * related.
   */
  OtherNavigation = 4,
  /**
   * Intended for airborne activities. Fall backs to `ActivityType.Other` if
   * unsupported.
   * @platform ios 12+
   */
  Airborne = 5,
}

// @needsAudit
/**
 * A type of the event that geofencing task can receive.
 */
export enum LocationGeofencingEventType {
  /**
   * Emitted when the device entered observed region.
   */
  Enter = 1,
  /**
   * Occurs as soon as the device left observed region
   */
  Exit = 2,
}

// @needsAudit
/**
 * State of the geofencing region that you receive through the geofencing task.
 */
export enum LocationGeofencingRegionState {
  /**
   * Indicates that the device position related to the region is unknown.
   */
  Unknown = 0,
  /**
   * Indicates that the device is inside the region.
   */
  Inside = 1,
  /**
   * Inverse of inside state.
   */
  Outside = 2,
}

// @needsAudit
/**
 * Type representing options argument in `getCurrentPositionAsync`.
 */
export type LocationOptions = {
  /**
   * Location manager accuracy. Pass one of `LocationAccuracy` enum values.
   * For low-accuracies the implementation can avoid geolocation providers
   * that consume a significant amount of power (such as GPS).
   */
  accuracy?: LocationAccuracy;
  /**
   * Specifies whether to ask the user to turn on improved accuracy location mode
   * which uses Wi-Fi, cell networks and GPS sensor.
   * @default true
   * @platform android
   */
  mayShowUserSettingsDialog?: boolean;
  /**
   * Minimum time to wait between each update in milliseconds.
   * Default value may depend on `accuracy` option.
   * @platform android
   */
  timeInterval?: number;
  /**
   * Receive updates only when the location has changed by at least this distance in meters.
   * Default value may depend on `accuracy` option.
   */
  distanceInterval?: number;
};

// @needsAudit
/**
 * Type representing options object that can be passed to `getLastKnownPositionAsync`.
 */
export type LocationLastKnownOptions = {
  /**
   * A number of milliseconds after which the last known location starts to be invalid and thus
   * `null` is returned.
   */
  maxAge?: number;
  /**
   * The maximum radius of uncertainty for the location, measured in meters. If the last known
   * location's accuracy radius is bigger (less accurate) then `null` is returned.
   */
  requiredAccuracy?: number;
};

// @needsAudit
/**
 * Type representing background location task options.
 */
export type LocationTaskOptions = LocationOptions & {
  /**
   * A boolean indicating whether the status bar changes its appearance when
   * location services are used in the background.
   * @default false
   * @platform ios 11+
   */
  showsBackgroundLocationIndicator?: boolean;
  /**
   * The distance in meters that must occur between last reported location and the current location
   * before deferred locations are reported.
   * @default 0
   */
  deferredUpdatesDistance?: number;
  // @docsMissing
  deferredUpdatesTimeout?: number;
  /**
   * Minimum time interval in milliseconds that must pass since last reported location before all
   * later locations are reported in a batched update
   * @default 0
   */
  deferredUpdatesInterval?: number;
  /**
   * The type of user activity associated with the location updates.
   * @see See [Apple docs](https://developer.apple.com/documentation/corelocation/cllocationmanager/1620567-activitytype) for more details.
   * @default LocationActivityType.Other
   * @platform ios
   */
  activityType?: LocationActivityType;
  /**
   * A boolean value indicating whether the location manager can pause location
   * updates to improve battery life without sacrificing location data. When this option is set to
   * `true`, the location manager pauses updates (and powers down the appropriate hardware) at times
   * when the location data is unlikely to change. You can help the determination of when to pause
   * location updates by assigning a value to the `activityType` property.
   * @default false
   * @platform ios
   */
  pausesUpdatesAutomatically?: boolean;
  foregroundService?: LocationTaskServiceOptions;
};

// @needsAudit
export type LocationTaskServiceOptions = {
  /**
   * Title of the foreground service notification.
   */
  notificationTitle: string;
  /**
   * Subtitle of the foreground service notification.
   */
  notificationBody: string;
  /**
   * Color of the foreground service notification. Accepts `#RRGGBB` and `#AARRGGBB` hex formats.
   */
  notificationColor?: string;
  /**
   * Boolean value whether to destroy the foreground service if the app is killed.
   */
  killServiceOnDestroy?: boolean;
};

// @needsAudit
/**
 * Type representing geofencing region object.
 */
export type LocationRegion = {
  /**
   * The identifier of the region object. Defaults to auto-generated UUID hash.
   */
  identifier?: string;
  /**
   * The latitude in degrees of region's center point.
   */
  latitude: number;
  /**
   * The longitude in degrees of region's center point.
   */
  longitude: number;
  /**
   * The radius measured in meters that defines the region's outer boundary.
   */
  radius: number;
  /**
   * Boolean value whether to call the task if the device enters the region.
   * @default true
   */
  notifyOnEnter?: boolean;
  /**
   * Boolean value whether to call the task if the device exits the region.
   * @default true
   */
  notifyOnExit?: boolean;
  /**
   * One of [GeofencingRegionState](#geofencingregionstate) region state. Determines whether the
   * device is inside or outside a region.
   */
  state?: LocationGeofencingRegionState;
};

// @needsAudit
/**
 * Type representing the location object.
 */
export type LocationObject = {
  /**
   * The coordinates of the position.
   */
  coords: LocationObjectCoords;
  /**
   * The time at which this position information was obtained, in milliseconds since epoch.
   */
  timestamp: number;
  /**
   * Whether the location coordinates is mocked or not.
   * @platform android
   */
  mocked?: boolean;
};

// @needsAudit
/**
 * Type representing the location GPS related data.
 */
export type LocationObjectCoords = {
  /**
   * The latitude in degrees.
   */
  latitude: number;
  /**
   * The longitude in degrees.
   */
  longitude: number;
  /**
   * The altitude in meters above the WGS 84 reference ellipsoid. Can be `null` on Web if it's not available.
   */
  altitude: number | null;
  /**
   * The radius of uncertainty for the location, measured in meters. Can be `null` on Web if it's not available.
   */
  accuracy: number | null;
  /**
   * The accuracy of the altitude value, in meters. Can be `null` on Web if it's not available.
   */
  altitudeAccuracy: number | null;
  /**
   * Horizontal direction of travel of this device, measured in degrees starting at due north and
   * continuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is
   * 180 degrees, and so on. Can be `null` on Web if it's not available.
   */
  heading: number | null;
  /**
   * The instantaneous speed of the device in meters per second. Can be `null` on Web if it's not available.
   */
  speed: number | null;
};

// @needsAudit
/**
 * Represents `watchPositionAsync` callback.
 */
export type LocationCallback = (location: LocationObject) => any;

// @needsAudit
/**
 * Represents the object containing details about location provider.
 */
export type LocationProviderStatus = {
  /**
   * Whether location services are enabled. See [Location.hasServicesEnabledAsync](#locationhasservicesenabledasync)
   * for a more convenient solution to get this value.
   */
  locationServicesEnabled: boolean;
  // @docsMissing
  backgroundModeEnabled: boolean;
  /**
   * Whether the GPS provider is available. If `true` the location data will come
   * from GPS, especially for requests with high accuracy.
   * @platform android
   */
  gpsAvailable?: boolean;
  /**
   * Whether the network provider is available. If `true` the location data will
   * come from cellular network, especially for requests with low accuracy.
   * @platform android
   */
  networkAvailable?: boolean;
  /**
   * Whether the passive provider is available. If `true` the location data will
   * be determined passively.
   * @platform android
   */
  passiveAvailable?: boolean;
};

// @needsAudit
/**
 * Type of the object containing heading details and provided by `watchHeadingAsync` callback.
 */
export type LocationHeadingObject = {
  /**
   * Measure of true north in degrees (needs location permissions, will return `-1` if not given).
   */
  trueHeading: number;
  /**
   * Measure of magnetic north in degrees.
   */
  magHeading: number;
  /**
   * Level of calibration of compass.
   * - `3`: high accuracy, `2`: medium accuracy, `1`: low accuracy, `0`: none
   * Reference for iOS:
   * - `3`: < 20 degrees uncertainty, `2`: < 35 degrees, `1`: < 50 degrees, `0`: > 50 degrees
   */
  accuracy: number;
};

// @needsAudit
/**
 * Represents `watchHeadingAsync` callback.
 */
export type LocationHeadingCallback = (location: LocationHeadingObject) => any;

// @needsAudit
/**
 * An object of options for forward and reverse geocoding.
 */
export type LocationGeocodingOptions = {
  /**
   * Whether to force using Google Maps API instead of the native implementation.
   * Used by default only on Web platform. Requires providing an API key by `setGoogleApiKey`.
   */
  useGoogleMaps?: boolean;
};

// @needsAudit
/**
 * Type representing a result of `geocodeAsync`.
 */
export type LocationGeocodedLocation = {
  /**
   * The latitude in degrees.
   */
  latitude: number;
  /**
   * The longitude in degrees.
   */
  longitude: number;
  /**
   * The altitude in meters above the WGS 84 reference ellipsoid.
   */
  altitude?: number;
  /**
   * The radius of uncertainty for the location, measured in meters.
   */
  accuracy?: number;
};

// @needsAudit
/**
 * Type representing a result of `reverseGeocodeAsync`.
 */
export type LocationGeocodedAddress = {
  /**
   * City name of the address.
   */
  city: string | null;
  /**
   * Additional city-level information like district name.
   */
  district: string | null;
  /**
   * Street number of the address.
   */
  streetNumber: string | null;
  /**
   * Street name of the address.
   */
  street: string | null;
  /**
   * The state or province associated with the address.
   */
  region: string | null;
  /**
   * Additional information about administrative area.
   */
  subregion: string | null;
  /**
   * Localized country name of the address.
   */
  country: string | null;
  /**
   * Postal code of the address.
   */
  postalCode: string | null;
  /**
   * The name of the placemark, for example, "Tower Bridge".
   */
  name: string | null;
  /**
   * Localized (ISO) country code of the address, if available.
   */
  isoCountryCode: string | null;
  /**
   * The timezone identifier associated with the address.
   * @platform ios
   */
  timezone: string | null;
};

// @needsAudit
/**
 * Represents subscription object returned by methods watching for new locations or headings.
 */
export type LocationSubscription = {
  /**
   * Call this function with no arguments to remove this subscription. The callback will no longer
   * be called for location updates.
   */
  remove: () => void;
};

// @needsAudit
export type PermissionDetailsLocationIOS = {
  /**
   * The scope of granted permission. Indicates when it's possible to use location.
   */
  scope: 'whenInUse' | 'always' | 'none';
};

// @needsAudit
export type PermissionDetailsLocationAndroid = {
  /**
   * @deprecated Use `accuracy` field instead.
   */
  scope: 'fine' | 'coarse' | 'none';
  /**
   * Indicates the type of location provider.
   */
  accuracy: 'fine' | 'coarse' | 'none';
};

// @needsAudit
/**
 * `LocationPermissionResponse` extends [PermissionResponse](permissions.md#permissionresponse)
 * type exported by `expo-modules-core` and contains additional platform-specific fields.
 */
export interface LocationPermissionResponse extends UMPermissionResponse {
  ios?: PermissionDetailsLocationIOS;
  android?: PermissionDetailsLocationAndroid;
}
