import { NativeModulesProxy } from 'expo-core';
import ThreeAxisSensor from './ThreeAxisSensor';

const { ExponentMagnetometerUncalibrated } = NativeModulesProxy;

export default new ThreeAxisSensor(
  ExponentMagnetometerUncalibrated,
  'magnetometerUncalibratedDidUpdate'
);
