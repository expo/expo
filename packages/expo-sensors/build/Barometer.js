import DeviceSensor from './DeviceSensor';
import ExpoBarometer from './ExpoBarometer';
/**
 * @platform android
 * @platform ios
 */
export class BarometerSensor extends DeviceSensor {
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     *
     * Check the availability of the device barometer. Requires at least Android 2.3 (API Level 9) and iOS 8.
     * @return A promise that resolves to a `boolean` denoting the availability of the sensor.
     */
    async isAvailableAsync() {
        return super.isAvailableAsync();
    }
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
    addListener(listener) {
        return super.addListener(listener);
    }
}
export default new BarometerSensor(ExpoBarometer, 'barometerDidUpdate');
//# sourceMappingURL=Barometer.js.map