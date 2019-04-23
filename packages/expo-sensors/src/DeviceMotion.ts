import DeviceSensor from './DeviceSensor';
import ExponentDeviceMotion from './ExponentDeviceMotion';

export interface DeviceMotionMeasurement {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  orientation: number;
}

class DeviceMotionSensor extends DeviceSensor<DeviceMotionMeasurement> {
  Gravity = ExponentDeviceMotion.Gravity;
}

export const Gravity = ExponentDeviceMotion.Gravity;

export default new DeviceMotionSensor(ExponentDeviceMotion, 'deviceMotionDidUpdate');
