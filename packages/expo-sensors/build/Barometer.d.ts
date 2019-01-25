import DeviceSensor from './DeviceSensor';
declare type BarometerMeasurement = {
    pressure: number;
    relativeAltitude?: number;
};
declare class BarometerSensor extends DeviceSensor<BarometerMeasurement> {
}
declare const _default: BarometerSensor;
export default _default;
