interface Coordinates {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
}
interface Position {
    coords: Coordinates;
    timestamp: number;
}
interface PermissionResult {
    status: string;
}
declare const _default: {
    readonly name: string;
    getProviderStatusAsync(): Promise<{
        locationServicesEnabled: boolean;
    }>;
    getCurrentPositionAsync(options: Object): Promise<Position | null>;
    removeWatchAsync(watchId: any): Promise<void>;
    watchDeviceHeading(headingId: any): Promise<void>;
    geocodeAsync(): Promise<any[]>;
    reverseGeocodeAsync(): Promise<any[]>;
    watchPositionImplAsync(watchId: string, options: Object): Promise<string>;
    requestPermissionsAsync(): Promise<PermissionResult>;
};
export default _default;
