import { NativeModules, Platform } from 'react-native';

export enum BrightnessMode {
  UNKNOWN = 0,
  AUTOMATIC = 1,
  MANUAL = 2,
};

export async function getBrightnessAsync(): Promise<number> {
  return await NativeModules.ExpoBrightness.getBrightnessAsync();
}

export async function setBrightnessAsync(brightnessValue: number): Promise<void> {
  let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
  if (isNaN(clampedBrightnessValue)) {
    throw new TypeError(`setBrightnessAsync cannot be called with ${brightnessValue}`);
  }
  return await NativeModules.ExpoBrightness.setBrightnessAsync(clampedBrightnessValue);
}

export async function getSystemBrightnessAsync(): Promise<number> {
  if (Platform.OS !== 'android') {
    return await getBrightnessAsync();
  }
  return await NativeModules.ExpoBrightness.getSystemBrightnessAsync();
}

export async function setSystemBrightnessAsync(brightnessValue: number): Promise<void> {
  let clampedBrightnessValue = Math.max(0, Math.min(brightnessValue, 1));
  if (isNaN(clampedBrightnessValue)) {
    throw new TypeError(`setSystemBrightnessAsync cannot be called with ${brightnessValue}`);
  }
  if (Platform.OS !== 'android') {
    return await setBrightnessAsync(clampedBrightnessValue);
  }
  return await NativeModules.ExpoBrightness.setSystemBrightnessAsync(clampedBrightnessValue);
}

export async function useSystemBrightnessAsync(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  return await NativeModules.ExpoBrightness.useSystemBrightnessAsync();
}

export async function isUsingSystemBrightnessAsync(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  return await NativeModules.ExpoBrightness.isUsingSystemBrightnessAsync();
}

export async function getSystemBrightnessModeAsync(): Promise<BrightnessMode> {
  if (Platform.OS !== 'android') {
    return BrightnessMode.UNKNOWN;
  }
  return await NativeModules.ExpoBrightness.getSystemBrightnessModeAsync();
}

export async function setSystemBrightnessModeAsync(brightnessMode: BrightnessMode): Promise<void> {
  if (Platform.OS !== 'android' || brightnessMode === BrightnessMode.UNKNOWN) {
    return;
  }
  return await NativeModules.ExpoBrightness.setSystemBrightnessModeAsync(brightnessMode);
}
