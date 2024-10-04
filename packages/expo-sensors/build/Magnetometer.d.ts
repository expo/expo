import DeviceSensor from './DeviceSensor';
import type { Listener, Subscription } from './DeviceSensor';
/**
 * Each of these keys represents the strength of magnetic field along that particular axis measured in microteslas (`μT`).
 */
export type MagnetometerMeasurement = {
    /**
     * Value representing strength of magnetic field recorded in X axis.
     */
    x: number;
    /**
     * Value representing strength of magnetic field recorded in Y axis.
     */
    y: number;
    /**
     * Value representing strength of magnetic field recorded in Z axis.
     */
    z: number;
};
/**
 * @platform android
 * @platform ios
 */
export declare class MagnetometerSensor extends DeviceSensor<MagnetometerMeasurement> {
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     *
     * Check the availability of the device magnetometer. Requires at least Android 2.3 (API Level 9) and iOS 8.
     * @return A promise that resolves to a `boolean` denoting the availability of the sensor.
     */
    isAvailableAsync(): Promise<boolean>;
    /**
     * Subscribe for updates to the magnetometer.
     * @param listener A callback that is invoked when a barometer update is available. When invoked, the listener is provided with a single argument that is `MagnetometerMeasurement`.
     * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addListener(listener: Listener<MagnetometerMeasurement>): Subscription;
}
declare const _default: MagnetometerSensor;
export default _default;
//# sourceMappingURL=Magnetometer.d.ts.map