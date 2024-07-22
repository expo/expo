import type { Listener, Subscription } from './DeviceSensor';
import DeviceSensor from './DeviceSensor';
/**
 * The altitude data returned from the native sensors.
 */
export type BarometerMeasurement = {
    /**
     * Measurement in hectopascals (`hPa`).
     */
    pressure: number;
    /**
     * Measurement in meters (`m`).
     * @platform ios
     */
    relativeAltitude?: number;
    /**
     * Timestamp of the measurement in seconds.
     */
    timestamp: number;
};
/**
 * @platform android
 * @platform ios
 */
export declare class BarometerSensor extends DeviceSensor<BarometerMeasurement> {
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     *
     * Check the availability of the device barometer. Requires at least Android 2.3 (API Level 9) and iOS 8.
     * @return A promise that resolves to a `boolean` denoting the availability of the sensor.
     */
    isAvailableAsync(): Promise<boolean>;
    /**
     * Subscribe for updates to the barometer.
     * @param listener A callback that is invoked when a barometer update is available. When invoked, the listener is provided with a single argument that is `BarometerMeasurement`.
     *
     * @example
     * ```ts
     * const subscription = Barometer.addListener(({ pressure, relativeAltitude }) => {
     *   console.log({ pressure, relativeAltitude });
     * });
     * ```
     * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addListener(listener: Listener<BarometerMeasurement>): Subscription;
}
declare const _default: BarometerSensor;
export default _default;
//# sourceMappingURL=Barometer.d.ts.map