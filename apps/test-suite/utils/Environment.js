'use strict';
import { Platform } from '@unimodules/core';

import ExponentTest from '../ExponentTest';

export function isDeviceFarm() {
  return ExponentTest && ExponentTest.isInCI && Platform.OS === 'android';
}

export function isInteractive() {
  return !isDeviceFarm() && !isDetox();
}

export function isDetox() {
  return global.DETOX;
}
