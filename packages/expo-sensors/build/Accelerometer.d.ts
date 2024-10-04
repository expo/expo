import type { Listener, Subscription } from './DeviceSensor';
import DeviceSensor from './DeviceSensor';
/**
 * Each of these keys represents the acceleration along that particular axis in g-force (measured in `g`s).
 *
 * A `g` is a unit of gravitational force equal to that exerted by the earth’s gravitational field (`9.81 m/s^2`).
 */
export type AccelerometerMeasurement = {
    /**
     * Value of `g`s device reported in X axis.
     */
    x: number;
    /**
     * Value of `g`s device reported in Y axis.
     */
    y: number;
    /**
     * Value of `g`s device reported in Z axis.
     */
    z: number;
    /**
     * Timestamp of the measurement in seconds.
     */
    timestamp: number;
};
export declare class AccelerometerSensor extends DeviceSensor<AccelerometerMeasurement> {
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     *
     * Returns whether the accelerometer is enabled on the device.
     *
     * On mobile web, you must first invoke `Accelerometer.requestPermissionsAsync()` in a user interaction (i.e. touch event) before you can use this module.
     * If the `status` is not equal to `granted` then you should inform the end user that they may have to open settings.
     *
     * On **web** this starts a timer and waits to see if an event is fired. This should predict if the iOS device has the **device orientation** API disabled in
     * **Settings > Safari > Motion & Orientation Access**. Some devices will also not fire if the site isn't hosted with **HTTPS** as `DeviceMotion` is now considered a secure API.
     * There is no formal API for detecting the status of `DeviceMotion` so this API can sometimes be unreliable on web.
     *
     * @return A promise that resolves to a `boolean` denoting the availability of the accelerometer.
     */
    isAvailableAsync(): Promise<boolean>;
    /**
     * Subscribe for updates to the accelerometer.
     *
     * @param listener A callback that is invoked when an accelerometer update is available. When invoked,
     * the listener is provided a single argument that is an `AccelerometerMeasurement` object.
     *
     * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addListener(listener: Listener<AccelerometerMeasurement>): Subscription;
}
declare const _default: AccelerometerSensor;
export default _default;
//# sourceMappingURL=Accelerometer.d.ts.map