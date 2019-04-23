import DeviceSensor from './DeviceSensor';
import ExpoBarometer from './ExpoBarometer';

export interface BarometerMeasurement {
  pressure: number;
  relativeAltitude?: number;
}

class BarometerSensor extends DeviceSensor<BarometerMeasurement> {}

export default new BarometerSensor(ExpoBarometer, 'barometerDidUpdate');
