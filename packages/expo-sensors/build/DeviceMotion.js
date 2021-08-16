import DeviceSensor from './DeviceSensor';
import ExponentDeviceMotion from './ExponentDeviceMotion';
class DeviceMotionSensor extends DeviceSensor {
    constructor() {
        super(...arguments);
        this.Gravity = ExponentDeviceMotion.Gravity;
    }
}
export const Gravity = ExponentDeviceMotion.Gravity;
export default new DeviceMotionSensor(ExponentDeviceMotion, 'deviceMotionDidUpdate');
//# sourceMappingURL=DeviceMotion.js.map