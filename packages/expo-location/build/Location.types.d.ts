import { PermissionResponse as UMPermissionResponse } from 'unimodules-permissions-interface';
/**
 * Enum with available location accuracies.
 */
export declare enum LocationAccuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6
}
/**
 * Enum with available activity types of background location tracking.
 */
export declare enum LocationActivityType {
    Other = 1,
    AutomotiveNavigation = 2,
    Fitness = 3,
    OtherNavigation = 4,
    Airborne = 5
}
/**
 * A type of the event that geofencing task can receive.
 */
export declare enum LocationGeofencingEventType {
    Enter = 1,
    Exit = 2
}
/**
 * State of the geofencing region that you receive through the geofencing task.
 */
export declare enum LocationGeofencingRegionState {
    Unknown = 0,
    Inside = 1,
    Outside = 2
}
/**
 * Type representing options argument in `getCurrentPositionAsync`.
 */
export declare type LocationOptions = {
    accuracy?: LocationAccuracy;
    mayShowUserSettingsDialog?: boolean;
};
/**
 * Type representing options object that can be passed to `getLastKnownPositionAsync`.
 */
export declare type LocationLastKnownOptions = {
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
export declare type LocationTaskOptions = {
    accuracy?: LocationAccuracy;
    timeInterval?: number;
    distanceInterval?: number;
    showsBackgroundLocationIndicator?: boolean;
    deferredUpdatesDistance?: number;
    deferredUpdatesTimeout?: number;
    deferredUpdatesInterval?: number;
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
export declare type LocationRegion = {
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
export declare type LocationData = {
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
export declare type LocationCallback = (data: LocationData) => any;
/**
 * Represents the object containing details about location provider.
 */
export declare type LocationProviderStatus = {
    locationServicesEnabled: boolean;
    backgroundModeEnabled: boolean;
    gpsAvailable?: boolean;
    networkAvailable?: boolean;
    passiveAvailable?: boolean;
};
/**
 * Type of the object containing heading details and provided by `watchHeadingAsync` callback.
 */
export declare type LocationHeadingData = {
    trueHeading: number;
    magHeading: number;
    accuracy: number;
};
/**
 * Represents `watchHeadingAsync` callback.
 */
export declare type LocationHeadingCallback = (data: LocationHeadingData) => any;
/**
 * Type representing a result of `geocodeAsync`.
 */
export declare type LocationGeocodedLocation = {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
};
/**
 * Type representing a result of `reverseGeocodeAsync`.
 */
export declare type LocationGeocodedAddress = {
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
export declare type LocationSubscription = {
    remove: () => void;
};
export declare type PermissionDetailsLocationIOS = {
    scope: 'whenInUse' | 'always';
};
export declare type PermissionDetailsLocationAndroid = {
    scope: 'fine' | 'coarse' | 'none';
};
export interface PermissionResponse extends UMPermissionResponse {
    ios?: PermissionDetailsLocationIOS;
    android?: PermissionDetailsLocationAndroid;
}
