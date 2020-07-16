import { PermissionResponse } from 'unimodules-permissions-interface';
import { LocationLastKnownOptions, LocationData, LocationOptions } from './Location.types';
/**
 * Gets the permission details. The implementation is not very good as it actually requests
 * for the current location, but there is no better way on web so far :(
 */
declare function getPermissionsAsync(): Promise<PermissionResponse>;
declare const _default: {
    readonly name: string;
    getProviderStatusAsync(): Promise<{
        locationServicesEnabled: boolean;
    }>;
    getLastKnownPositionAsync(options?: LocationLastKnownOptions): Promise<LocationData | null>;
    getCurrentPositionAsync(options: LocationOptions): Promise<LocationData>;
    removeWatchAsync(watchId: any): Promise<void>;
    watchDeviceHeading(headingId: any): Promise<void>;
    hasServicesEnabledAsync(): Promise<boolean>;
    geocodeAsync(): Promise<any[]>;
    reverseGeocodeAsync(): Promise<any[]>;
    watchPositionImplAsync(watchId: string, options: LocationOptions): Promise<string>;
    getPermissionsAsync: typeof getPermissionsAsync;
    requestPermissionsAsync(): Promise<PermissionResponse>;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
