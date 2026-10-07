/**
 * A use case that each platform turns into an accuracy, an update interval and a power budget.
 *
 * On Android it maps to a `LocationRequest` priority and interval.
 *
 * On iOS 17 and newer it maps to a `CLLocationUpdate.LiveConfiguration`; on older versions to a `CLLocationManager` activity type
 * with the best available accuracy.
 */
export enum LocationProfile {
  /**
   * General-purpose positioning, for anything the other profiles do not cover.
   *
   * On Android, balanced priority with updates about every 5 seconds.
   *
   * On iOS, `CLLocationUpdate.LiveConfiguration.default`.
   */
  DEFAULT = 'default',
  /**
   * Turn-by-turn navigation in a vehicle.
   *
   * On Android, high accuracy with updates about every second.
   *
   * On iOS, `CLLocationUpdate.LiveConfiguration.automotiveNavigation`.
   */
  AUTOMOTIVE_NAVIGATION = 'automotiveNavigation',
  /**
   * Navigation on foot, by bike or on water.
   *
   * On Android, high accuracy with updates about every 2 seconds.
   *
   * On iOS, `CLLocationUpdate.LiveConfiguration.otherNavigation`.
   */
  OTHER_NAVIGATION = 'otherNavigation',
  /**
   * Workout tracking such as running or cycling.
   *
   * On Android, high accuracy with updates about every 2 seconds.
   *
   * On iOS, `CLLocationUpdate.LiveConfiguration.fitness`.
   */
  FITNESS = 'fitness',
  /**
   * Flying, such as in a plane or a glider.
   *
   * On Android, high accuracy with updates about every second.
   *
   * On iOS, `CLLocationUpdate.LiveConfiguration.airborne`.
   */
  AIRBORNE = 'airborne',
  /**
   * Coarse position at the lowest power use.
   *
   * On Android, low-power priority with updates about every 60 seconds and cached fixes up to 5 minutes old.
   *
   * On iOS, kilometer accuracy with a 3 km distance filter, on every iOS version.
   */
  LOW_POWER = 'lowPower',
}

/**
 * A set of coordinates expressed in decimal degrees.
 * @example
 * {
 *  latitude: 40.7128,
 *  longitude: -74.0060
 * }
 */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * A single location fix.
 * @example
 * ```ts
 * {
 *   coordinates: { latitude: 50.0614, longitude: 19.9372 },
 *   horizontalAccuracy: 12.5,   // meters
 *   timestamp: 1791277756380,   // milliseconds since the Unix epoch
 *   altitude: 253.1,            // meters above the WGS 84 ellipsoid
 *   mslAltitude: 212.4,         // meters above mean sea level
 *   verticalAccuracy: 4.8,      // meters
 *   mocked: false,
 *   heading: 87.3,              // degrees clockwise from true north, course over ground
 *   headingAccuracy: 5,         // degrees
 *   speed: 1.4,                 // meters per second
 *   speedAccuracy: 0.3,         // meters per second
 * }
 * ```
 */
export type Position = {
  /**
   * The latitude and longitude of the fix, in degrees.
   */
  coordinates: Coordinates;
  /**
   * The radius around `coordinates` within which the device is, in meters.
   */
  horizontalAccuracy: number | null;
  /**
   * When the fix was taken, in milliseconds since the Unix epoch. Check it when the position must be
   * fresh, because a fix can be older than the moment it was delivered.
   */
  timestamp: number;
  /**
   * Height above the WGS 84 ellipsoid, in meters.
   */
  altitude: number | null;
  /**
   * Height above mean sea level, in meters.
   *
   * @platform android 14+
   * @platform ios
   */
  mslAltitude: number | null;
  /**
   * The uncertainty of `altitude` and `mslAltitude`, in meters.
   *
   * @platform android 8+
   * @platform ios
   */
  verticalAccuracy: number | null;
  /**
   * Whether the fix comes from a simulated source, such as a simulator or a mock location app.
   *
   * On Android it maps to `Location.isMock` on Android 12 and newer and to `Location.isFromMockProvider()` below;
   * on iOS to `CLLocation.sourceInformation.isSimulatedBySoftware`.
   */
  mocked: boolean;
  /**
   * The direction in which the device is traveling, in degrees clockwise from true north,
   * from `0` to `360`. It is unrelated to the device's orientation.
   */
  heading: number | null;
  /**
   * The uncertainty of `heading`, in degrees.
   *
   * @platform android 8+
   * @platform ios
   */
  headingAccuracy: number | null;
  /**
   * The speed, in meters per second.
   */
  speed: number | null;
  /**
   * The uncertainty of `speed`, in meters per second.
   *
   * @platform android 8+
   * @platform ios
   */
  speedAccuracy: number | null;
};

/**
 * Options for [`getPosition`](#getpositionoptions).
 */
export type GetPositionOptions = {
  /**
   * The maximum age of a cached location that may be returned.
   * Expressed in seconds.
   *
   * If a new location fix is not available within the timeout, the cached location will be returned regardless of its age.
   * @default 0
   */
  maxCachedAge?: number;
  /**
   * The maximum time to wait for a new location fix.
   * Expressed in seconds.
   *
   * If the timeout is set to 0, it will return the last known location, if available.
   *
   * On Android, the providers cap it at 30 seconds.
   * @default 30
   */
  timeout?: number;
  /**
   * The use case the fix is for. It changes the way the location is requested from the OS and can affect accuracy and power usage.
   * On iOS, a reduced accuracy authorization limits the fix whatever the profile; see [Request an approximate location](#request-an-approximate-location).
   * @default LocationProfile.DEFAULT
   */
  profile?: LocationProfile;
};

/**
 * The reason a watcher stopped delivering positions, passed to `onError`.
 */
export type PositionWatchError = {
  /**
   * A stable identifier of the failure, for branching in code.
   */
  code: string;
  /**
   * A description of the failure, for logs and error screens.
   */
  message: string;
};

/**
 * One `positionChanged` event from the native watcher: a position or an error, never both.
 */
export type PositionUpdate =
  | { data: Position; error: null }
  | { data: null; error: PositionWatchError };

/**
 * A snapshot of the watcher's flags, returned by `status()`.
 */
export type PositionWatchStatus = {
  /**
   * Whether the provider is feeding positions right now.
   */
  isSubscribed: boolean;
  /**
   * Whether the handle can still be brought back to sending. False only once released.
   */
  isHandleAlive: boolean;
  /**
   * Whether delivery has been started. On Android, it is `true` while at least one listener is attached.
   */
  isStarted: boolean;
  /**
   * Whether `pause()` was called and `resume()` was not called yet.
   */
  isPaused: boolean;
  /**
   * Whether the app is in the foreground. On Android, the watcher holds the system request only while
   * it is `true`.
   */
  isInForeground: boolean;
};

/**
 * The parameters of `watchPosition`.
 */
export type WatchPositionParams = {
  /**
   * The use case the positions are for. It selects the accuracy and the update rate.
   * @default LocationProfile.DEFAULT
   */
  profile?: LocationProfile;
  /**
   * Called with every delivered position.
   */
  onPosition: (position: Position) => void;
  /**
   * Called when the watcher cannot deliver positions, for example when the provider refuses the
   * request after the app returns to the foreground.
   */
  onError?: (error: PositionWatchError) => void;
};
