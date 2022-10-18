import DeviceSensor from './DeviceSensor';
import ExponentDeviceMotion from './ExponentDeviceMotion';
export var DeviceMotionOrientation;
(function (DeviceMotionOrientation) {
    DeviceMotionOrientation[DeviceMotionOrientation["Portrait"] = 0] = "Portrait";
    DeviceMotionOrientation[DeviceMotionOrientation["RightLandscape"] = 90] = "RightLandscape";
    DeviceMotionOrientation[DeviceMotionOrientation["UpsideDown"] = 180] = "UpsideDown";
    DeviceMotionOrientation[DeviceMotionOrientation["LeftLandscape"] = -90] = "LeftLandscape";
})(DeviceMotionOrientation || (DeviceMotionOrientation = {}));
export class DeviceMotionSensor extends DeviceSensor {
    /**
     * Constant value representing standard gravitational acceleration for Earth (`9.80665` m/s^2).
     */
    Gravity = ExponentDeviceMotion.Gravity;
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     *
     * Returns whether the accelerometer is enabled on the device.
     *
     * On mobile web, you must first invoke `DeviceMotion.requestPermissionsAsync()` in a user interaction (i.e. touch event) before you can use this module.
     * If the `status` is not equal to `granted` then you should inform the end user that they may have to open settings.
     *
     * On **web** this starts a timer and waits to see if an event is fired. This should predict if the iOS device has the **device orientation** API disabled in
     * **Settings > Safari > Motion & Orientation Access**. Some devices will also not fire if the site isn't hosted with **HTTPS** as `DeviceMotion` is now considered a secure API.
     * There is no formal API for detecting the status of `DeviceMotion` so this API can sometimes be unreliable on web.
     *
     * @return A promise that resolves to a `boolean` denoting the availability of device motion sensor.
     */
    async isAvailableAsync() {
        return super.isAvailableAsync();
    }
    /**
     * Subscribe for updates to the device motion sensor.
     *
     * @param listener A callback that is invoked when a device motion sensor update is available. When invoked,
     * the listener is provided a single argument that is a `DeviceMotionMeasurement` object.
     *
     * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addListener(listener) {
        return super.addListener(listener);
    }
}
/**
 * Constant value representing standard gravitational acceleration for Earth (`9.80665` m/s^2).
 */
export const Gravity = ExponentDeviceMotion.Gravity;
export default new DeviceMotionSensor(ExponentDeviceMotion, 'deviceMotionDidUpdate');
//# sourceMappingURL=DeviceMotion.js.map