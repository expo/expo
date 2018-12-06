import { EventEmitter } from 'expo-core';
interface ProviderStatus {
    locationServicesEnabled: boolean;
    gpsAvailable?: boolean;
    networkAvailable?: boolean;
    passiveAvailable?: boolean;
}
interface LocationOptions {
    accuracy?: Accuracy;
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
    accuracy?: Accuracy;
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
declare enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6
}
declare enum GeofencingEventType {
    Enter = 1,
    Exit = 2
}
declare enum GeofencingRegionState {
    Unknown = 0,
    Inside = 1,
    Outside = 2
}
declare function _getCurrentWatchId(): number;
declare function getProviderStatusAsync(): Promise<ProviderStatus>;
declare function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationData>;
declare function getHeadingAsync(): Promise<HeadingData>;
declare function watchHeadingAsync(callback: HeadingCallback): Promise<object>;
declare function geocodeAsync(address: string): Promise<Array<GeocodedLocation>>;
declare function reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
}): Promise<Address[]>;
declare function setApiKey(apiKey: string): void;
declare function watchPositionAsync(options: LocationOptions, callback: LocationCallback): Promise<{
    remove(): void;
}>;
declare function requestPermissionsAsync(): Promise<void>;
declare function hasServicesEnabledAsync(): Promise<boolean>;
declare function startLocationUpdatesAsync(taskName: string, options?: LocationTaskOptions): Promise<void>;
declare function stopLocationUpdatesAsync(taskName: string): Promise<void>;
declare function hasStartedLocationUpdatesAsync(taskName: string): Promise<boolean>;
declare function startGeofencingAsync(taskName: string, regions?: Array<Region>): Promise<void>;
declare function stopGeofencingAsync(taskName: string): Promise<void>;
declare function hasStartedGeofencingAsync(taskName: string): Promise<boolean>;
declare function installWebGeolocationPolyfill(): void;
export declare const Location: {
    EventEmitter: EventEmitter;
    _getCurrentWatchId: typeof _getCurrentWatchId;
    Accuracy: typeof Accuracy;
    GeofencingEventType: typeof GeofencingEventType;
    GeofencingRegionState: typeof GeofencingRegionState;
    getProviderStatusAsync: typeof getProviderStatusAsync;
    getCurrentPositionAsync: typeof getCurrentPositionAsync;
    getHeadingAsync: typeof getHeadingAsync;
    watchHeadingAsync: typeof watchHeadingAsync;
    geocodeAsync: typeof geocodeAsync;
    reverseGeocodeAsync: typeof reverseGeocodeAsync;
    setApiKey: typeof setApiKey;
    watchPositionAsync: typeof watchPositionAsync;
    requestPermissionsAsync: typeof requestPermissionsAsync;
    hasServicesEnabledAsync: typeof hasServicesEnabledAsync;
    startLocationUpdatesAsync: typeof startLocationUpdatesAsync;
    stopLocationUpdatesAsync: typeof stopLocationUpdatesAsync;
    hasStartedLocationUpdatesAsync: typeof hasStartedLocationUpdatesAsync;
    startGeofencingAsync: typeof startGeofencingAsync;
    stopGeofencingAsync: typeof stopGeofencingAsync;
    hasStartedGeofencingAsync: typeof hasStartedGeofencingAsync;
    installWebGeolocationPolyfill: typeof installWebGeolocationPolyfill;
};
export {};
