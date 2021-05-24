import { PermissionResponse, PermissionStatus, PermissionExpiration } from 'expo-modules-core';
export { PermissionResponse, PermissionStatus, PermissionExpiration };
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Returns whether the AdMob API is enabled on the current device. This does not check the native configuration.
 *
 * @returns Async `boolean`, indicating whether the AdMob API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
export declare function setTestDeviceIDAsync(testDeviceID: string | null): Promise<void>;
