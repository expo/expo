import DeviceSensor from './DeviceSensor';
declare type Measurement = {
    acceleration: {
        x: number;
        y: number;
        z: number;
    };
    accelerationIncludingGravity: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        alpha: number;
        beta: number;
        gamma: number;
    };
    rotationRate: {
        alpha: number;
        beta: number;
        gamma: number;
    };
    orientation: number;
};
declare class DeviceMotionSensor extends DeviceSensor<Measurement> {
    Gravity: any;
}
export declare const Gravity: any;
declare const _default: DeviceMotionSensor;
export default _default;
