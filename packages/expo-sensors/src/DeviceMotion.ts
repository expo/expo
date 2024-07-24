import DeviceSensor, { Listener, Subscription } from './DeviceSensor';
import ExponentDeviceMotion from './ExponentDeviceMotion';

export type DeviceMotionMeasurement = {
  /**
   * Device acceleration on the three axis as an object with `x`, `y`, `z` keys. Expressed in meters per second squared (m/s^2).
   */
  acceleration: null | {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  /**
   * Device acceleration with the effect of gravity on the three axis as an object with `x`, `y`, `z` keys. Expressed in meters per second squared (m/s^2).
   */
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
    timestamp: number;
  };
  /**
   * Device's orientation in space as an object with alpha, beta, gamma keys where alpha is for rotation around Z axis, beta for X axis rotation and gamma for Y axis rotation.
   */
  rotation: {
    alpha: number;
    beta: number;
    gamma: number;
    timestamp: number;
  };
  /**
   * Device's rate of rotation in space expressed in degrees per second (deg/s).
   */
  rotationRate: null | {
    /**
     * Rotation in X axis.
     */
    alpha: number;
    /**
     * Rotation in Y axis.
     */
    beta: number;
    /**
     * Rotation in Z axis.
     */
    gamma: number;
    /**
     * Timestamp of the measurement in seconds.
     */
    timestamp: number;
  };
  /**
   * Interval at which data is obtained from the native platform. Expressed in **milliseconds** (ms).
   */
  interval: number;
  /**
   * Device orientation based on screen rotation. Value is one of:
   * - `0` (portrait),
   * - `90` (right landscape),
   * - `180` (upside down),
   * - `-90` (left landscape).
   */
  orientation: DeviceMotionOrientation;
};

export enum DeviceMotionOrientation {
  Portrait = 0,
  RightLandscape = 90,
  UpsideDown = 180,
  LeftLandscape = -90,
}

export class DeviceMotionSensor extends DeviceSensor<DeviceMotionMeasurement> {
  /**
   * Constant value representing standard gravitational acceleration for Earth (`9.80665` m/s^2).
   */
  Gravity: number = ExponentDeviceMotion.Gravity;

  /**
   * > **info** You should always check the sensor availability before attempting to use it.
   *
   * Returns whether the accelerometer is enabled on the device.
   *
   * On mobile web, you must first invoke `DeviceMotion.requestPermissionsAsync()` in a user interaction (i.e. touch event) before you can use this module.
   * If the `status` is not equal to `granted` then you should inform the end user that they may have to open settings.
   *
   * On **web** this starts a timer and waits to see if an event is fired. This should predict if the iOS device has the **device orientation** API disabled in
   * **Settings > Safari > Motion & Orientation Access**. Some devices will also not fire if the site isn't hosted with **HTTPS** as `DeviceMotion` is now considered a secure API.
   * There is no formal API for detecting the status of `DeviceMotion` so this API can sometimes be unreliable on web.
   *
   * @return A promise that resolves to a `boolean` denoting the availability of device motion sensor.
   */
  async isAvailableAsync(): Promise<boolean> {
    return super.isAvailableAsync();
  }

  /**
   * Subscribe for updates to the device motion sensor.
   *
   * @param listener A callback that is invoked when a device motion sensor update is available. When invoked,
   * the listener is provided a single argument that is a `DeviceMotionMeasurement` object.
   *
   * @return A subscription that you can call `remove()` on when you would like to unsubscribe the listener.
   */
  addListener(listener: Listener<DeviceMotionMeasurement>): Subscription {
    return super.addListener(listener);
  }
}

/**
 * Constant value representing standard gravitational acceleration for Earth (`9.80665` m/s^2).
 */
export const Gravity: number = ExponentDeviceMotion.Gravity;

export default new DeviceMotionSensor(ExponentDeviceMotion, 'deviceMotionDidUpdate');
