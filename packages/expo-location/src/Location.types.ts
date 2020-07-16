import { PermissionResponse as UMPermissionResponse } from 'unimodules-permissions-interface';

/**
 * Enum with available location accuracies.
 */
export enum LocationAccuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}

/**
 * Enum with available activity types of background location tracking.
 */
export enum LocationActivityType {
  Other = 1,
  AutomotiveNavigation = 2,
  Fitness = 3,
  OtherNavigation = 4,
  Airborne = 5,
}

/**
 * A type of the event that geofencing task can receive.
 */
export enum LocationGeofencingEventType {
  Enter = 1,
  Exit = 2,
}

/**
 * State of the geofencing region that you receive through the geofencing task.
 */
export enum LocationGeofencingRegionState {
  Unknown = 0,
  Inside = 1,
  Outside = 2,
}

/**
 * Type representing options argument in `getCurrentPositionAsync`.
 */
export type LocationOptions = {
  accuracy?: LocationAccuracy;
  mayShowUserSettingsDialog?: boolean;
};

/**
 * Type representing options object that can be passed to `getLastKnownPositionAsync`.
 */
export type LocationLastKnownOptions = {
  /**
   * Maximum age of the location in miliseconds.
   */
  maxAge?: number;

  /**
   * Maximum radius of horizontal accuracy in meters.
   */
  requiredAccuracy?: number;
};

/**
 * Type representing background location task options.
 */
export type LocationTaskOptions = {
  accuracy?: LocationAccuracy;
  timeInterval?: number; // Android only
  distanceInterval?: number;
  showsBackgroundLocationIndicator?: boolean; // iOS only
  deferredUpdatesDistance?: number;
  deferredUpdatesTimeout?: number;
  deferredUpdatesInterval?: number;

  // iOS only
  activityType?: LocationActivityType;
  pausesUpdatesAutomatically?: boolean;

  foregroundService?: {
    notificationTitle: string;
    notificationBody: string;
    notificationColor?: string;
  };
};

/**
 * Type representing geofencing region object.
 */
export type LocationRegion = {
  identifier?: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
};

/**
 * Type representing the location object.
 */
export type LocationData = {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
};

/**
 * Represents `watchPositionAsync` callback.
 */
export type LocationCallback = (data: LocationData) => any;

/**
 * Represents the object containing details about location provider.
 */
export type LocationProviderStatus = {
  locationServicesEnabled: boolean;
  backgroundModeEnabled: boolean;
  gpsAvailable?: boolean;
  networkAvailable?: boolean;
  passiveAvailable?: boolean;
};

/**
 * Type of the object containing heading details and provided by `watchHeadingAsync` callback.
 */
export type LocationHeadingData = {
  trueHeading: number;
  magHeading: number;
  accuracy: number;
};

/**
 * Represents `watchHeadingAsync` callback.
 */
export type LocationHeadingCallback = (data: LocationHeadingData) => any;

/**
 * Type representing a result of `geocodeAsync`.
 */
export type LocationGeocodedLocation = {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
};

/**
 * Type representing a result of `reverseGeocodeAsync`.
 */
export type LocationGeocodedAddress = {
  city: string;
  street: string;
  region: string;
  country: string;
  postalCode: string;
  name: string;
  isoCountryCode: string | null;
};

/**
 * Represents subscription object returned by methods watching for new locations or headings.
 */
export type LocationSubscription = {
  remove: () => void;
};

export type PermissionDetailsLocationIOS = {
  scope: 'whenInUse' | 'always';
};

export type PermissionDetailsLocationAndroid = {
  scope: 'fine' | 'coarse' | 'none';
};

export interface PermissionResponse extends UMPermissionResponse {
  ios?: PermissionDetailsLocationIOS;
  android?: PermissionDetailsLocationAndroid;
}
