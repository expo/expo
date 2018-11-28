import { NativeModulesProxy } from 'expo-core';
import DeviceSensor from './DeviceSensor';
const { ExponentDeviceMotion } = NativeModulesProxy;
class DeviceMotionSensor extends DeviceSensor {
    constructor() {
        super(...arguments);
        this.Gravity = ExponentDeviceMotion.Gravity;
    }
}
export const Gravity = ExponentDeviceMotion.Gravity;
export default new DeviceMotionSensor(ExponentDeviceMotion, 'deviceMotionDidUpdate');
//# sourceMappingURL=DeviceMotion.js.map