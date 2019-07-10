import ExpoDevice from './ExpoDevice';

import { deviceNamesByCode } from './DeviceNameByCode';
import { Platform, UnavailabilityError } from '@unimodules/core';

export const brand = ExpoDevice ? ExpoDevice.brand : null;
export const manufacturer = ExpoDevice ? ExpoDevice.manufacturer : null;
let model;
let fingerprint;
if (Platform.OS === 'ios') {
  let deviceName;
  let deviceId = ExpoDevice.deviceId;
  if (deviceId) {
    deviceName = deviceNamesByCode[deviceId];
    if (!deviceName) {
      // Not found on database. At least guess main device type from string contents:
      if (deviceId.startsWith('iPod')) {
        deviceName = 'iPod Touch';
      } else if (deviceId.startsWith('iPad')) {
        deviceName = 'iPad';
      } else if (deviceId.startsWith('iPhone')) {
        deviceName = 'iPhone';
      } else if (deviceId.startsWith('AppleTV')) {
        deviceName = 'Apple TV';
      }
    }
  }
  model = deviceName;
  fingerprint = null;
} else {
  model = ExpoDevice ? ExpoDevice.modelName : null;
  fingerprint = ExpoDevice ? ExpoDevice.osBuildFingerprint : null;
}
export const osBuildFingerprint = fingerprint;
export const modelName = model;
export const osName = ExpoDevice ? ExpoDevice.osName : null;
export const totalMemory = ExpoDevice ? ExpoDevice.totalMemory : null;
export const isDevice = ExpoDevice ? ExpoDevice.isDevice : null;
export const deviceType = ExpoDevice ? ExpoDevice.deviceType : null;
export const modelId = ExpoDevice ? ExpoDevice.modelId : null;
export const supportedCPUArchitectures = ExpoDevice ? ExpoDevice.supportedCPUArchitectures : null;
export const designName = ExpoDevice ? ExpoDevice.designName : null;
export const systemBuildId = ExpoDevice ? ExpoDevice.systemBuildId : null;
export const productName = ExpoDevice ? ExpoDevice.productName : null;
export const platformApiLevel = ExpoDevice ? ExpoDevice.platformApiLevel : null;
export const osVersion = ExpoDevice ? ExpoDevice.osVersion : null;
export const deviceName = ExpoDevice ? ExpoDevice.deviceName : null;
export const osBuildId = ExpoDevice ? ExpoDevice.osBuildId : null;

export async function hasPlatformFeatureAsync(feature: string): Promise<boolean> {
  if (!ExpoDevice.hasPlatformFeatureAsync) {
    throw new UnavailabilityError('expo-device', 'hasPlatformFeatureAsync');
  }
  return await ExpoDevice.hasPlatformFeatureAsync(feature);
}

export async function getPlatformFeaturesAsync(): Promise<string[]> {
  if (!ExpoDevice.getPlatformFeaturesAsync) {
    throw new UnavailabilityError('expo-device', 'getPlatformFeaturesAsync');
  }
  return await ExpoDevice.getPlatformFeaturesAsync();
}

export async function getMaxMemoryAsync(): Promise<number> {
  if (!ExpoDevice.getMaxMemoryAsync) {
    throw new UnavailabilityError('expo-device', 'getMaxMemoryAsync');
  }
  return await ExpoDevice.getMaxMemoryAsync();
}

export async function isSideLoadingEnabled(): Promise<boolean> {
  if (!ExpoDevice.isSideLoadingEnabled) {
    throw new UnavailabilityError('expo-device', 'isSideLoadingEnabled');
  }
  return await ExpoDevice.isSideLoadingEnabled();
}

export async function getUptimeAsync(): Promise<number> {
  if (!ExpoDevice.getUptimeAsync) {
    throw new UnavailabilityError('expo-device', 'getUptimeAsync');
  }
  return await ExpoDevice.getUptimeAsync();
}

export async function isRootedExperimentalAsync(): Promise<boolean> {
  if (!ExpoDevice.isRootedExperimentalAsync) {
    throw new UnavailabilityError('expo-device', 'isRootedExperimentalAsync');
  }
  return await ExpoDevice.isRootedExperimentalAsync();
}
