import DeviceSensor from './DeviceSensor';
import ExpoBarometer from './ExpoBarometer';

type BarometerMeasurement = {
  pressure: number;
  relativeAltitude?: number;
};

class BarometerSensor extends DeviceSensor<BarometerMeasurement> {}

export default new BarometerSensor(ExpoBarometer, 'barometerDidUpdate');
