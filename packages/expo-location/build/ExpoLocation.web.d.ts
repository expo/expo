import { PermissionResponse } from 'expo-modules-core';
import { LocationLastKnownOptions, LocationObject, LocationOptions } from './Location.types';
/**
 * Gets the permission details. The implementation is not very good as it's not
 * possible to query for permission on all browsers, apparently only the
 * latest versions will support this.
 */
declare function getPermissionsAsync(shouldAsk?: boolean): Promise<PermissionResponse>;
declare const _default: {
    getProviderStatusAsync(): Promise<{
        locationServicesEnabled: boolean;
    }>;
    getLastKnownPositionAsync(options?: LocationLastKnownOptions): Promise<LocationObject | null>;
    getCurrentPositionAsync(options: LocationOptions): Promise<LocationObject>;
    removeWatchAsync(watchId: any): Promise<void>;
    watchDeviceHeading(headingId: any): Promise<void>;
    hasServicesEnabledAsync(): Promise<boolean>;
    geocodeAsync(): Promise<any[]>;
    reverseGeocodeAsync(): Promise<any[]>;
    watchPositionImplAsync(watchId: string, options: LocationOptions): Promise<string>;
    getPermissionsAsync: typeof getPermissionsAsync;
    requestPermissionsAsync(): Promise<PermissionResponse>;
    requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
    requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
    getForegroundPermissionsAsync(): Promise<PermissionResponse>;
    getBackgroundPermissionsAsync(): Promise<PermissionResponse>;
    startObserving(): void;
    stopObserving(): void;
};
export default _default;
//# sourceMappingURL=ExpoLocation.web.d.ts.map