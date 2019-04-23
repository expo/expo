import { Platform } from 'react-native';
import { NativeModulesProxy } from '@unimodules/core';

export enum BrightnessMode {
  UNKNOWN = 0,
  AUTOMATIC = 1,
  MANUAL = 2,
};

export async function getBrightnessAsync(): Promise<number> {
  return await NativeModulesProxy.ExpoBrightness.getBrightnessAsync();
}

export async function setBrightnessAsync(brightnessValue: number): Promise<void> {
  let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
  if (isNaN(clampedBrightnessValue)) {
    throw new TypeError(`setBrightnessAsync cannot be called with ${brightnessValue}`);
  }
  return await NativeModulesProxy.ExpoBrightness.setBrightnessAsync(clampedBrightnessValue);
}

export async function getSystemBrightnessAsync(): Promise<number> {
  if (Platform.OS !== 'android') {
    return await getBrightnessAsync();
  }
  return await NativeModulesProxy.ExpoBrightness.getSystemBrightnessAsync();
}

export async function setSystemBrightnessAsync(brightnessValue: number): Promise<void> {
  let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
  if (isNaN(clampedBrightnessValue)) {
    throw new TypeError(`setSystemBrightnessAsync cannot be called with ${brightnessValue}`);
  }
  if (Platform.OS !== 'android') {
    return await setBrightnessAsync(clampedBrightnessValue);
  }
  return await NativeModulesProxy.ExpoBrightness.setSystemBrightnessAsync(clampedBrightnessValue);
}

export async function useSystemBrightnessAsync(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  return await NativeModulesProxy.ExpoBrightness.useSystemBrightnessAsync();
}

export async function isUsingSystemBrightnessAsync(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  return await NativeModulesProxy.ExpoBrightness.isUsingSystemBrightnessAsync();
}

export async function getSystemBrightnessModeAsync(): Promise<BrightnessMode> {
  if (Platform.OS !== 'android') {
    return BrightnessMode.UNKNOWN;
  }
  return await NativeModulesProxy.ExpoBrightness.getSystemBrightnessModeAsync();
}

export async function setSystemBrightnessModeAsync(brightnessMode: BrightnessMode): Promise<void> {
  if (Platform.OS !== 'android' || brightnessMode === BrightnessMode.UNKNOWN) {
    return;
  }
  return await NativeModulesProxy.ExpoBrightness.setSystemBrightnessModeAsync(brightnessMode);
}
