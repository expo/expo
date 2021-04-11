import DeviceSensor from './DeviceSensor';
import ExpoProximity from './ExpoProximity';

export interface ProximityMeasurement {
  proximityState: boolean;
}

class ProximitySensor extends DeviceSensor<ProximityMeasurement> {}

export default new ProximitySensor(ExpoProximity, 'proximityDidUpdate');
