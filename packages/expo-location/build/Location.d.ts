import { EventEmitter } from '@unimodules/core';
import { PermissionResponse as UMPermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';
declare const LocationEventEmitter: EventEmitter;
export interface ProviderStatus {
    locationServicesEnabled: boolean;
    backgroundModeEnabled: boolean;
    gpsAvailable?: boolean;
    networkAvailable?: boolean;
    passiveAvailable?: boolean;
}
export interface LocationOptions {
    accuracy?: LocationAccuracy;
    maximumAge?: number;
    enableHighAccuracy?: boolean;
    timeInterval?: number;
    distanceInterval?: number;
    timeout?: number;
    mayShowUserSettingsDialog?: boolean;
}
export interface LocationData {
    coords: {
        latitude: number;
        longitude: number;
        altitude: number;
        accuracy: number;
        heading: number;
        speed: number;
    };
    timestamp: number;
}
export interface HeadingData {
    trueHeading: number;
    magHeading: number;
    accuracy: number;
}
export interface GeocodedLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
}
export interface Address {
    city: string;
    street: string;
    region: string;
    country: string;
    postalCode: string;
    name: string;
}
export { PermissionStatus };
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
export interface LocationTaskOptions {
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
}
export interface LocationRegion {
    identifier?: string;
    latitude: number;
    longitude: number;
    radius: number;
    notifyOnEnter?: boolean;
    notifyOnExit?: boolean;
}
export declare type LocationCallback = (data: LocationData) => any;
export declare type LocationHeadingCallback = (data: HeadingData) => any;
declare enum LocationAccuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6
}
declare enum LocationActivityType {
    Other = 1,
    AutomotiveNavigation = 2,
    Fitness = 3,
    OtherNavigation = 4,
    Airborne = 5
}
export { LocationAccuracy as Accuracy, LocationActivityType as ActivityType };
export declare enum GeofencingEventType {
    Enter = 1,
    Exit = 2
}
export declare enum GeofencingRegionState {
    Unknown = 0,
    Inside = 1,
    Outside = 2
}
declare function _getCurrentWatchId(): number;
export declare function getProviderStatusAsync(): Promise<ProviderStatus>;
export declare function enableNetworkProviderAsync(): Promise<void>;
export declare function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationData>;
export declare function getLastKnownPositionAsync(): Promise<LocationData>;
export declare function getHeadingAsync(): Promise<HeadingData>;
export declare function watchHeadingAsync(callback: LocationHeadingCallback): Promise<{
    remove: () => void;
}>;
export declare function geocodeAsync(address: string): Promise<GeocodedLocation[]>;
export declare function reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
}): Promise<Address[]>;
export declare function setApiKey(apiKey: string): void;
export declare function watchPositionAsync(options: LocationOptions, callback: LocationCallback): Promise<{
    remove(): void;
}>;
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
export declare function hasServicesEnabledAsync(): Promise<boolean>;
export declare function isBackgroundLocationAvailableAsync(): Promise<boolean>;
export declare function startLocationUpdatesAsync(taskName: string, options?: LocationTaskOptions): Promise<void>;
export declare function stopLocationUpdatesAsync(taskName: string): Promise<void>;
export declare function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
export declare function startGeofencingAsync(taskName: string, regions?: LocationRegion[]): Promise<void>;
export declare function stopGeofencingAsync(taskName: string): Promise<void>;
export declare function hasStartedGeofencingAsync(taskName: string): Promise<boolean>;
export declare function installWebGeolocationPolyfill(): void;
export { LocationEventEmitter as EventEmitter, _getCurrentWatchId, };
