import DeviceSensor from './DeviceSensor';

export interface ThreeAxisMeasurement {
  x: number;
  y: number;
  z: number;
}

/**
 * A base class for subscribable sensors that take {x, y, z} measurements.
 */
export default class ThreeAxisSensor extends DeviceSensor<ThreeAxisMeasurement> {}
