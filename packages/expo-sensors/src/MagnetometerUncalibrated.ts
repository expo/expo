import DeviceSensor from './DeviceSensor';
import ExponentMagnetometerUncalibrated from './ExponentMagnetometerUncalibrated';

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
export class MagnetometerUncalibratedSensor extends DeviceSensor<MagnetometerUncalibratedMeasurement> {}

export default new MagnetometerUncalibratedSensor(
  ExponentMagnetometerUncalibrated,
  'magnetometerUncalibratedDidUpdate'
);
