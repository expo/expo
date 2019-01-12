import DeviceSensor from './DeviceSensor';
import ExponentBarometer from './ExponentBarometer';

type PressureMeasurement = {
  pressure: number;
};

class BarometerSensor extends DeviceSensor<PressureMeasurement> {}

export default new BarometerSensor(ExponentBarometer, 'barometerDidUpdate');
