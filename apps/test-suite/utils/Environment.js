'use strict';
import { Platform } from 'expo-modules-core';

import ExponentTest from '../ExponentTest';

export function isDeviceFarm() {
  return ExponentTest && ExponentTest.isInCI && Platform.OS === 'android';
}

export function isInteractive() {
  return !isDeviceFarm();
}
