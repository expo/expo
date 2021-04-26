import DeviceSensor from './DeviceSensor';
export interface DeviceMotionMeasurement {
    acceleration: null | {
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
    /**
     * Device's rate of rotation in space expressed in degrees per second (deg/s).
     */
    rotationRate: null | {
        /**
         * x axis rotation.
         */
        alpha: number;
        /**
         * y axis rotation.
         */
        beta: number;
        /**
         * z axis rotation.
         */
        gamma: number;
    };
    /**
     * Interval at which data is obtained from the native platform. Expressed in **milliseconds**.
     */
    interval: number;
    orientation: number;
}
declare class DeviceMotionSensor extends DeviceSensor<DeviceMotionMeasurement> {
    Gravity: any;
}
export declare const Gravity: any;
declare const _default: DeviceMotionSensor;
export default _default;
