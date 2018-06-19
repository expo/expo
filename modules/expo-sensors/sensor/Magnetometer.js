// @flow

import { NativeModulesProxy } from 'expo-core';
import ThreeAxisSensor from './ThreeAxisSensor';

const { ExponentMagnetometer } = NativeModulesProxy;

export default new ThreeAxisSensor(ExponentMagnetometer, 'magnetometerDidUpdate');
