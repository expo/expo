import { Subscription } from 'expo-modules-core';
import { BatteryLevelEvent, BatteryState, BatteryStateEvent, PowerModeEvent, PowerState } from './Battery.types';
/**
 * Resolves with whether the battery API is available on the current device. The value of this
 * property is `true` on Android and physical iOS devices and `false` on iOS simulators. On web,
 * it depends on whether the browser supports the web battery API.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Gets the battery level of the device as a number between `0` and `1`, inclusive. If the device
 * does not support retrieving the battery level, this method returns `-1`. On web, this method
 * always returns `-1`.
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
 * Gets the current status of Low Power mode on iOS and Power Saver mode on Android. If a platform
 * doesn't support Low Power mode reporting (like web, older Android devices), the reported low-power
 * state is always `false`, even if the device is actually in low-power mode.
 * @return Returns a `Promise` which fulfills with a `boolean` value of either `true` or `false`,
 * indicating whether low power mode is enabled or disabled, respectively.
 * @example
 * Low Power Mode (iOS) or Power Saver Mode (Android) are enabled.
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
 * the system is currently operating in Low Power Mode (iOS) or Power Saver Mode (Android). This
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
 * On iOS devices, the event fires when the battery level drops one percent or more, but is only
 * fired once per minute at maximum.
 *
 * On Android devices, the event fires only when significant changes happens, which is when the
 * battery level drops below [`"android.intent.action.BATTERY_LOW"`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_LOW)
 * or rises above [`"android.intent.action.BATTERY_OKAY"`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_OKAY)
 * from a low battery level. See [here](https://developer.android.com/training/monitoring-device-state/battery-monitoring)
 * to read more from the Android docs.
 *
 * On web, the event never fires.
 * @param listener A callback that is invoked when battery level changes. The callback is provided a
 * single argument that is an object with a `batteryLevel` key.
 * @return A `Subscription` object on which you can call `remove()` to unsubscribe from the listener.s
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
 * Subscribe to Low Power Mode (iOS) or Power Saver Mode (Android) updates. The event fires whenever
 * the power mode is toggled.
 *
 * On web, the event never fires.
 * @param listener A callback that is invoked when Low Power Mode (iOS) or Power Saver Mode (Android)
 * changes. The callback is provided a single argument that is an object with a `lowPowerMode` key.
 * @return A `Subscription` object on which you can call `remove()` to unsubscribe from the listener.
 */
export declare function addLowPowerModeListener(listener: (event: PowerModeEvent) => void): Subscription;
/**
 * ```ts
 * const batteryLevel = useBatteryLevel();
 * ```
 * Returns the battery level of the device
 *
 * @see addBatteryLevelListener
 * @return The battery level of the device
 */
export declare function useBatteryLevel(): number;
/**
 * ```ts
 * const batteryState = useBatteryState();
 * ```
 * Returns the battery state of the device
 *
 * @see addBatteryStateListener
 * @return The battery state of the device
 */
export declare function useBatteryState(): BatteryState;
/**
 * ```ts
 * const lowPowerMode = useLowPowerMode();
 * ```
 * Returns boolean indicating if the device is in low power mode
 *
 * @see addLowPowerModeListener
 * @return boolean indicating if the device is in low power mode
 */
export declare function useLowPowerMode(): boolean;
/**
 * ```ts
 * const { lowPowerMode, batteryLevel, batteryState } = usePowerState();
 * ```
 * Returns power state information
 *
 * @see PowerState
 * @return power state information
 */
export declare function usePowerState(): PowerState;
export { BatteryLevelEvent, BatteryState, BatteryStateEvent, PowerModeEvent, PowerState, Subscription, };
//# sourceMappingURL=Battery.d.ts.map