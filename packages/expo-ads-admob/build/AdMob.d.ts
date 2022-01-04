import { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions } from 'expo-modules-core';
export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions for AdMob.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = AdsAdMob.usePermission();
 * ```
 */
export declare const usePermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Returns whether the AdMob API is enabled on the current device. This does not check the native configuration.
 *
 * @returns Async `boolean`, indicating whether the AdMob API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
export declare function setTestDeviceIDAsync(testDeviceID: string | null): Promise<void>;
//# sourceMappingURL=AdMob.d.ts.map