import DeviceSensor from './DeviceSensor';
export interface BarometerMeasurement {
    pressure: number;
    relativeAltitude?: number;
}
declare class BarometerSensor extends DeviceSensor<BarometerMeasurement> {
}
declare const _default: BarometerSensor;
export default _default;
