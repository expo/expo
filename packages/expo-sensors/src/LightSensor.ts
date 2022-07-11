import DeviceSensor from './DeviceSensor';
import ExpoLightSensor from './ExpoLightSensor';

export interface LightSensorMeasurement {
  luminosity: number;
}

class LightSensor extends DeviceSensor<LightSensorMeasurement> {}

export default new LightSensor(ExpoLightSensor, 'lightSensorDidUpdate');
