import { EventEmitter } from 'expo-core';
declare const LocationEventEmitter: EventEmitter;
interface ProviderStatus {
    locationServicesEnabled: boolean;
    gpsAvailable?: boolean;
    networkAvailable?: boolean;
    passiveAvailable?: boolean;
}
interface LocationOptions {
    accuracy?: LocationAccuracy;
    enableHighAccuracy?: boolean;
    timeInterval?: number;
    distanceInterval?: number;
    timeout?: number;
}
interface LocationData {
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
interface HeadingData {
    trueHeading: number;
    magHeading: number;
    accuracy: number;
}
interface GeocodedLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
}
interface Address {
    city: string;
    street: string;
    region: string;
    country: string;
    postalCode: string;
    name: string;
}
interface LocationTaskOptions {
    accuracy?: LocationAccuracy;
    showsBackgroundLocationIndicator?: boolean;
}
interface Region {
    identifier?: string;
    latitude: number;
    longitude: number;
    radius: number;
    notifyOnEnter?: boolean;
    notifyOnExit?: boolean;
}
declare type LocationCallback = (data: LocationData) => any;
declare type HeadingCallback = (data: HeadingData) => any;
declare enum LocationAccuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6
}
export { LocationAccuracy as Accuracy };
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
export declare function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationData>;
export declare function getHeadingAsync(): Promise<HeadingData>;
export declare function watchHeadingAsync(callback: HeadingCallback): Promise<object>;
export declare function geocodeAsync(address: string): Promise<Array<GeocodedLocation>>;
export declare function reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
}): Promise<Address[]>;
export declare function watchPositionAsync(options: LocationOptions, callback: LocationCallback): Promise<{
    remove(): void;
}>;
export declare function requestPermissionsAsync(): Promise<void>;
export declare function hasServicesEnabledAsync(): Promise<boolean>;
export declare function startLocationUpdatesAsync(taskName: string, options?: LocationTaskOptions): Promise<void>;
export declare function stopLocationUpdatesAsync(taskName: string): Promise<void>;
export declare function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
export declare function startGeofencingAsync(taskName: string, regions?: Array<Region>): Promise<void>;
export declare function stopGeofencingAsync(taskName: string): Promise<void>;
export declare function hasStartedGeofencingAsync(taskName: string): Promise<boolean>;
export declare function installWebGeolocationPolyfill(): void;
export { LocationEventEmitter as EventEmitter, _getCurrentWatchId, };
