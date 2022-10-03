import { PermissionExpiration, PermissionHookOptions, PermissionResponse, PermissionStatus, Subscription } from 'expo-modules-core';
export declare enum BrightnessMode {
    /**
     * Means that the current brightness mode cannot be determined.
     */
    UNKNOWN = 0,
    /**
     * Mode in which the device OS will automatically adjust the screen brightness depending on the
     * ambient light.
     */
    AUTOMATIC = 1,
    /**
     * Mode in which the screen brightness will remain constant and will not be adjusted by the OS.
     */
    MANUAL = 2
}
export declare type BrightnessEvent = {
    /**
     * A number between `0` and `1`, inclusive, representing the current screen brightness.
     */
    brightness: number;
};
export { PermissionExpiration, PermissionHookOptions, PermissionResponse, PermissionStatus };
/**
 * Returns whether the Brightness API is enabled on the current device. This does not check the app
 * permissions.
 * @return Async `boolean`, indicating whether the Brightness API is available on the current device.
 * Currently this resolves `true` on iOS and Android only.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Gets the current brightness level of the device's main screen.
 * @return A `Promise` that fulfils with a number between `0` and `1`, inclusive, representing the
 * current screen brightness.
 */
export declare function getBrightnessAsync(): Promise<number>;
/**
 * Sets the current screen brightness. On iOS, this setting will persist until the device is locked,
 * after which the screen brightness will revert to the user's default setting. On Android, this
 * setting only applies to the current activity; it will override the system brightness value
 * whenever your app is in the foreground.
 * @param brightnessValue A number between `0` and `1`, inclusive, representing the desired screen
 * brightness.
 * @return A `Promise` that fulfils when the brightness has been successfully set.
 */
export declare function setBrightnessAsync(brightnessValue: number): Promise<void>;
/**
 * Gets the global system screen brightness.
 * @return A `Promise` that is resolved with a number between `0` and `1`, inclusive, representing
 * the current system screen brightness.
 * @platform android
 */
export declare function getSystemBrightnessAsync(): Promise<number>;
/**
 * > __WARNING:__ This method is experimental.
 *
 * Sets the global system screen brightness and changes the brightness mode to
 * `MANUAL`. Requires `SYSTEM_BRIGHTNESS` permissions.
 * @param brightnessValue A number between `0` and `1`, inclusive, representing the desired screen
 * brightness.
 * @return A `Promise` that fulfils when the brightness has been successfully set.
 * @platform android
 */
export declare function setSystemBrightnessAsync(brightnessValue: number): Promise<void>;
/**
 * Resets the brightness setting of the current activity to use the system-wide
 * brightness value rather than overriding it.
 * @return A `Promise` that fulfils when the setting has been successfully changed.
 * @platform android
 */
export declare function useSystemBrightnessAsync(): Promise<void>;
/**
 * Returns a boolean specifying whether or not the current activity is using the
 * system-wide brightness value.
 * @return A `Promise` that fulfils with `true` when the current activity is using the system-wide
 * brightness value, and `false` otherwise.
 * @platform android
 */
export declare function isUsingSystemBrightnessAsync(): Promise<boolean>;
/**
 * Gets the system brightness mode (e.g. whether or not the OS will automatically
 * adjust the screen brightness depending on ambient light).
 * @return A `Promise` that fulfils with a [`BrightnessMode`](#brightnessmode). Requires
 * `SYSTEM_BRIGHTNESS` permissions.
 * @platform android
 */
export declare function getSystemBrightnessModeAsync(): Promise<BrightnessMode>;
/**
 * Sets the system brightness mode.
 * @param brightnessMode One of `BrightnessMode.MANUAL` or `BrightnessMode.AUTOMATIC`. The system
 * brightness mode cannot be set to `BrightnessMode.UNKNOWN`.
 * @platform android
 */
export declare function setSystemBrightnessModeAsync(brightnessMode: BrightnessMode): Promise<void>;
/**
 * Checks user's permissions for accessing system brightness.
 * @return A promise that fulfils with an object of type [PermissionResponse](#permissionrespons).
 */
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Asks the user to grant permissions for accessing system brightness.
 * @return A promise that fulfils with an object of type [PermissionResponse](#permissionrespons).
 */
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions to modify the system brightness.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = Brightness.usePermissions();
 * ```
 */
export declare const usePermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * Subscribe to brightness (iOS) updates. The event fires whenever
 * the power mode is toggled.
 *
 * On web and android the event never fires.
 * @param listener A callback that is invoked when brightness (iOS) changes.
 * The callback is provided a single argument that is an object with a `brightness` key.
 * @return A `Subscription` object on which you can call `remove()` to unsubscribe from the listener.
 * @platform ios
 */
export declare function addBrightnessListener(listener: (event: BrightnessEvent) => void): Subscription;
//# sourceMappingURL=Brightness.d.ts.map