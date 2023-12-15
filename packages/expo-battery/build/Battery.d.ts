import type { Subscription } from 'expo-modules-core';
import { BatteryState } from './Battery.types';
import type { BatteryLevelEvent, BatteryStateEvent, PowerModeEvent, PowerState } from './Battery.types';
/**
 * Resolves with whether the battery API is available on the current device. The value of this
 * property is `true` on Android and physical iOS devices and `false` on iOS simulators. On web,
 * it depends on whether the browser supports the web battery API.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Gets the battery level of the device as a number between `0` and `1`, inclusive. If the device
 * does not support retrieving the battery level, this method returns `-1`. On web, this method
 * always returns `1`.
 * @return A `Promise` that fulfils with a number between `0` and `1` representing the battery level,
 * or `-1` if the device does not provide it.
 * @example
 * ```ts
 * await Battery.getBatteryLevelAsync();
 * // 0.759999
 * ```
 */
export declare function getBatteryLevelAsync(): Promise<number>;
/**
 * Tells the battery's current state. On web, this always returns `BatteryState.UNKNOWN`.
 * @return Returns a `Promise` which fulfills with a [`Battery.BatteryState`](#batterystate) enum
 * value for whether the device is any of the four states.
 * @example
 * ```ts
 * await Battery.getBatteryStateAsync();
 * // BatteryState.CHARGING
 * ```
 */
export declare function getBatteryStateAsync(): Promise<BatteryState>;
/**
 * Gets the current status of Power Saver mode on Android and Low Power mode on iOS. If a platform
 * doesn't support Low Power mode reporting (like web, older Android devices), the reported low-power
 * state is always `false`, even if the device is actually in low-power mode.
 * @return Returns a `Promise` which fulfills with a `boolean` value of either `true` or `false`,
 * indicating whether low power mode is enabled or disabled.
 * @example
 * Power Saver Mode (Android) or Low Power Mode (iOS) are enabled.
 * ```ts
 * await Battery.isLowPowerModeEnabledAsync();
 * // true
 * ```
 */
export declare function isLowPowerModeEnabledAsync(): Promise<boolean>;
/**
 * Checks whether battery optimization is enabled for your application.
 * If battery optimization is enabled for your app, background tasks might be affected
 * when your app goes into doze mode state. (only on Android 6.0 or later)
 * @return Returns a `Promise` which fulfills with a `boolean` value of either `true` or `false`,
 * indicating whether the battery optimization is enabled or disabled, respectively. (Android only)
 * @example
 * ```ts
 * await Battery.isBatteryOptimizationEnabledAsync();
 * // true
 * ```
 */
export declare function isBatteryOptimizationEnabledAsync(): Promise<boolean>;
/**
 * Gets the power state of the device including the battery level, whether it is plugged in, and if
 * the system is currently operating in Power Saver Mode (Android) or Low Power Mode (iOS). This
 * method re-throws any errors that occur when retrieving any of the power-state information.
 * @return Returns a `Promise` which fulfills with [`PowerState`](#powerstate) object.
 * @example
 * ```ts
 * await Battery.getPowerStateAsync();
 * // {
 * //   batteryLevel: 0.759999,
 * //   batteryState: BatteryState.UNPLUGGED,
 * //   lowPowerMode: true,
 * // }
 * ```
 */
export declare function getPowerStateAsync(): Promise<PowerState>;
/**
 * Subscribe to the battery level change updates.
 *
 * On Android devices, the event fires only when significant changes happens, which is when the
 * battery level drops below [`android.intent.action.BATTERY_LOW`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_LOW)
 * or rises above [`android.intent.action.BATTERY_OKAY`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_OKAY)
 * from a low battery level. See [Monitor the Battery Level and Charging State](https://developer.android.com/training/monitoring-device-state/battery-monitoring)
 * in Android documentation for more information.
 *
 * On iOS devices, the event fires when the battery level drops one percent or more, but is only
 * fired once per minute at maximum.
 *
 * On web, the event never fires.
 * @param listener A callback that is invoked when battery level changes. The callback is provided a
 * single argument that is an object with a `batteryLevel` key.
 * @return A `Subscription` object on which you can call `remove()` to unsubscribe from the listener.
 */
export declare function addBatteryLevelListener(listener: (event: BatteryLevelEvent) => void): Subscription;
/**
 * Subscribe to the battery state change updates to receive an object with a [`Battery.BatteryState`](#batterystate)
 * enum value for whether the device is any of the four states.
 *
 * On web, the event never fires.
 * @param listener A callback that is invoked when battery state changes. The callback is provided a
 * single argument that is an object with a `batteryState` key.
 * @return A `Subscription` object on which you can call `remove()` to unsubscribe from the listener.
 */
export declare function addBatteryStateListener(listener: (event: BatteryStateEvent) => void): Subscription;
/**
 * Subscribe to  Power Saver Mode (Android) or Low Power Mode (iOS) updates. The event fires whenever
 * the power mode is toggled.
 *
 * On web, the event never fires.
 * @param listener A callback that is invoked when Power Saver Mode (Android) or  Low Power Mode (iOS)
 * changes. The callback is provided a single argument that is an object with a `lowPowerMode` key.
 * @return A `Subscription` object on which you can call `remove()` to unsubscribe from the listener.
 */
export declare function addLowPowerModeListener(listener: (event: PowerModeEvent) => void): Subscription;
/**
 * Gets the device's battery level, as in [`getBatteryLevelAsync`](#getbatterylevelasync).
 *
 * @example
 * ```ts
 * const batteryLevel = useBatteryLevel();
 * ```
 *
 * @return The battery level of the device.
 */
export declare function useBatteryLevel(): number;
/**
 * Gets the device's battery state, as in [`getBatteryStateAsync`](#getbatterystateasync).
 *
 * @example
 * ```ts
 * const batteryState = useBatteryState();
 * ```
 *
 * @return The battery state of the device.
 */
export declare function useBatteryState(): BatteryState;
/**
 * Boolean that indicates if the device is in low power or power saver mode, as in  [`isLowPowerModeEnabledAsync`](#islowpowermodeenabledasync).
 *
 * @example
 * ```ts
 * const lowPowerMode = useLowPowerMode();
 * ```
 *
 * @return Returns a boolean indicating if the device is in low power mode.
 */
export declare function useLowPowerMode(): boolean;
/**
 * Gets the device's power state information, as in [`getPowerStateAsync`](#getpowerstateasync).
 *
 * @example
 * ```ts
 * const { lowPowerMode, batteryLevel, batteryState } = usePowerState();
 * ```
 *
 * @return Returns power state information.
 */
export declare function usePowerState(): PowerState;
export { BatteryState };
export type { BatteryLevelEvent, BatteryStateEvent, PowerModeEvent, PowerState, Subscription };
//# sourceMappingURL=Battery.d.ts.map