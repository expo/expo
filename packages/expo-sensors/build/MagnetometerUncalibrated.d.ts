import DeviceSensor from './DeviceSensor';
/**
 * Each of these keys represents the uncalibrated strength of magnetic field along that particular axis measured in microteslas (`μT`).
 */
export type MagnetometerUncalibratedMeasurement = {
    /**
     * Value representing uncalibrated strength of magnetic field recorded in X axis.
     */
    x: number;
    /**
     * Value representing uncalibrated strength of magnetic field recorded in Y axis.
     */
    y: number;
    /**
     * Value representing uncalibrated strength of magnetic field recorded in Z axis.
     */
    z: number;
    /**
     * Timestamp of the measurement in seconds.
     */
    timestamp: number;
};
/**
 * @platform android
 * @platform ios
 */
export declare class MagnetometerUncalibratedSensor extends DeviceSensor<MagnetometerUncalibratedMeasurement> {
}
declare const _default: MagnetometerUncalibratedSensor;
export default _default;
//# sourceMappingURL=MagnetometerUncalibrated.d.ts.map