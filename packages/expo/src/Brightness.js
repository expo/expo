// @flow

import { NativeModules, Platform } from 'react-native';

export async function getBrightnessAsync(): Promise<number> {
  return await NativeModules.ExponentBrightness.getBrightnessAsync();
}

export async function setBrightnessAsync(brightnessValue: number): Promise<void> {
  brightnessValue = Math.max(0, Math.min(brightnessValue, 1));
  return await NativeModules.ExponentBrightness.setBrightnessAsync(brightnessValue);
}

export async function getSystemBrightnessAsync(): Promise<number> {
  if (Platform.OS !== 'android') {
    return await getBrightnessAsync();
  }
  return await NativeModules.ExponentBrightness.getSystemBrightnessAsync();
}

export async function setSystemBrightnessAsync(brightnessValue: number): Promise<void> {
  brightnessValue = Math.max(0, Math.min(brightnessValue, 1));
  if (Platform.OS !== 'android') {
    return await setBrightnessAsync(brightnessValue);
  } else {
    return await NativeModules.ExponentBrightness.setSystemBrightnessAsync(brightnessValue);
  }
}
