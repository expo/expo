import DeviceSensor from './DeviceSensor';
import ExpoLightSensor from './ExpoLightSensor';
/**
 * @platform android
 */
export class LightSensor extends DeviceSensor {
    /**
     * > **info** You should always check the sensor availability before attempting to use it.
     *
     * Returns whether the light sensor is available and enabled on the device. Requires at least Android 2.3 (API Level 9).
     *
     * @return A promise that resolves to a `boolean` denoting the availability of the light sensor.
     */
    async isAvailableAsync() {
        return super.isAvailableAsync();
    }
    /**
     * Subscribe for updates to the light sensor.
     *
     * @param listener A callback that is invoked when a LightSensor update is available. When invoked,
     * the listener is provided a single argument that is the illuminance value.
     *
     * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addListener(listener) {
        return super.addListener(listener);
    }
}
export default new LightSensor(ExpoLightSensor, 'lightSensorDidUpdate');
//# sourceMappingURL=LightSensor.js.map