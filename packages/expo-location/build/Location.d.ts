declare const LocationEventEmitter: any;
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
export declare enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6
}
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
export declare function geocodeAsync(address: string): Promise<any>;
export declare function reverseGeocodeAsync(location: {
    latitude: number;
    longitude: number;
}): Promise<any>;
export declare function setApiKey(apiKey: string): void;
export declare function watchPositionAsync(options: LocationOptions, callback: LocationCallback): Promise<{
    remove(): void;
}>;
export declare function requestPermissionsAsync(): Promise<any>;
export declare function hasServicesEnabledAsync(): Promise<boolean>;
export declare function startLocationUpdatesAsync(taskName: string, options?: LocationTaskOptions): Promise<void>;
export declare function stopLocationUpdatesAsync(taskName: string): Promise<null>;
export declare function hasStartedLocationUpdatesAsync(taskName: string): Promise<null>;
export declare function startGeofencingAsync(taskName: string, regions?: Array<Region>): Promise<null>;
export declare function stopGeofencingAsync(taskName: string): Promise<null>;
export declare function hasStartedGeofencingAsync(taskName: string): Promise<null>;
export { LocationEventEmitter as EventEmitter, _getCurrentWatchId, };
