import DeviceSensor from './DeviceSensor';
export interface ProximityMeasurement {
    proximityState: boolean;
}
declare class ProximitySensor extends DeviceSensor<ProximityMeasurement> {
}
declare const _default: ProximitySensor;
export default _default;
