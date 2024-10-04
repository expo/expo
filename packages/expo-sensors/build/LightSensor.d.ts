import DeviceSensor from './DeviceSensor';
import type { Listener, Subscription } from './DeviceSensor';
export type LightSensorMeasurement = {
    /**
     * Ambient light level registered by the device measured in lux (lx).
     */
    illuminance: number;
    /**
     * Timestamp of the measurement in seconds.
     */
    timestamp: number;
};
/**
 * @platform android
 */
export declare class LightSensor extends DeviceSensor<LightSensorMeasurement> {
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     *
     * Returns whether the light sensor is available and enabled on the device. Requires at least Android 2.3 (API Level 9).
     *
     * @return A promise that resolves to a `boolean` denoting the availability of the light sensor.
     */
    isAvailableAsync(): Promise<boolean>;
    /**
     * Subscribe for updates to the light sensor.
     *
     * @param listener A callback that is invoked when a LightSensor update is available. When invoked,
     * the listener is provided a single argument that is the illuminance value.
     *
     * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addListener(listener: Listener<LightSensorMeasurement>): Subscription;
}
declare const _default: LightSensor;
export default _default;
//# sourceMappingURL=LightSensor.d.ts.map