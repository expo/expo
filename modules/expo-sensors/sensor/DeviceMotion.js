// @flow

import { NativeModulesProxy } from 'expo-core';

import DeviceSensor from './DeviceSensor';

const { ExponentDeviceMotion } = NativeModulesProxy;

type Measurement = {
  acceleration: {
    x: number,
    y: number,
    z: number,
  },
  accelerationIncludingGravity: {
    x: number,
    y: number,
    z: number,
  },
  rotation: {
    alpha: number,
    beta: number,
    gamma: number,
  },
  rotationRate: {
    alpha: number,
    beta: number,
    gamma: number,
  },
  orientation: number,
};

class DeviceMotionSensor extends DeviceSensor<Measurement> {
  Gravity = ExponentDeviceMotion.Gravity;
}

export const Gravity = ExponentDeviceMotion.Gravity;

export default new DeviceMotionSensor(ExponentDeviceMotion, 'deviceMotionDidUpdate');
