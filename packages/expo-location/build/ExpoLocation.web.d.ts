import { PermissionResponse } from 'expo-modules-core';
import { LocationLastKnownOptions, LocationObject, LocationOptions } from './Location.types';
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
    requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
    requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
    getForegroundPermissionsAsync(): Promise<PermissionResponse>;
    getBackgroundPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
//# sourceMappingURL=ExpoLocation.web.d.ts.map