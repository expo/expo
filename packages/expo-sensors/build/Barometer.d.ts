import DeviceSensor from './DeviceSensor';
declare type PressureMeasurement = {
    pressure: number;
    relativeAltitude?: number;
};
declare class BarometerSensor extends DeviceSensor<PressureMeasurement> {
}
declare const _default: BarometerSensor;
export default _default;
