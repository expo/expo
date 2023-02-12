import DeviceSensor from './DeviceSensor';
import ExponentAccelerometer from './ExponentAccelerometer';
export class AccelerometerSensor extends DeviceSensor {
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
    async isAvailableAsync() {
        return super.isAvailableAsync();
    }
    /**
     * Subscribe for updates to the accelerometer.
     *
     * @param listener A callback that is invoked when an accelerometer update is available. When invoked,
     * the listener is provided a single argument that is an `AccelerometerMeasurement` object.
     *
     * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addListener(listener) {
        return super.addListener(listener);
    }
}
export default new AccelerometerSensor(ExponentAccelerometer, 'accelerometerDidUpdate');
//# sourceMappingURL=Accelerometer.js.map