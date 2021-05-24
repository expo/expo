import { PermissionResponse, PermissionStatus } from 'expo-modules-core';
export declare enum BrightnessMode {
    UNKNOWN = 0,
    AUTOMATIC = 1,
    MANUAL = 2
}
export { PermissionResponse, PermissionStatus };
/**
 * Returns whether the Brightness API is enabled on the current device. This does not check the app permissions.
 *
 * @returns Async `boolean`, indicating whether the Brightness API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
export declare function getBrightnessAsync(): Promise<number>;
export declare function setBrightnessAsync(brightnessValue: number): Promise<void>;
export declare function getSystemBrightnessAsync(): Promise<number>;
export declare function setSystemBrightnessAsync(brightnessValue: number): Promise<void>;
export declare function useSystemBrightnessAsync(): Promise<void>;
export declare function isUsingSystemBrightnessAsync(): Promise<boolean>;
export declare function getSystemBrightnessModeAsync(): Promise<BrightnessMode>;
export declare function setSystemBrightnessModeAsync(brightnessMode: BrightnessMode): Promise<void>;
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
