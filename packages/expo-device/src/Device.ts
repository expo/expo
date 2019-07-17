import { Platform, UnavailabilityError } from '@unimodules/core';
import ExpoDevice from './ExpoDevice';

import { deviceNamesByCode } from './DeviceNameByCode';
import { DeviceType as _DeviceType } from './Device.types';

export{
  _DeviceType as DeviceType
}

export const brand = ExpoDevice ? ExpoDevice.brand : null;
export const manufacturer = ExpoDevice ? ExpoDevice.manufacturer : null;
let model;
let fingerprint;
let platformModelId;
let platformDesignName;
let platformProductName;
let platformApi;
if (Platform.OS === 'ios') {
  let deviceName;
  let iOSmodelId = ExpoDevice.modelId;
  if (iOSmodelId) {
    deviceName = deviceNamesByCode[iOSmodelId];
    if (!deviceName) {
      // Not found on database. At least guess main device type from string contents:
      if (iOSmodelId.startsWith('iPod')) {
        deviceName = 'iPod Touch';
      } else if (iOSmodelId.startsWith('iPad')) {
        deviceName = 'iPad';
      } else if (iOSmodelId.startsWith('iPhone')) {
        deviceName = 'iPhone';
      } else if (iOSmodelId.startsWith('AppleTV')) {
        deviceName = 'Apple TV';
      }
    }
  }
  model = deviceName;
  fingerprint = null;
  platformModelId = ExpoDevice ? ExpoDevice.modelId : null;
  platformDesignName = null;
  platformProductName = null;
  platformApi = null;
} else {
  model = ExpoDevice ? ExpoDevice.modelName : null;
  fingerprint = ExpoDevice ? ExpoDevice.osBuildFingerprint : null;
  platformModelId = null;
  platformDesignName = ExpoDevice ? ExpoDevice.designName : null;
  platformProductName = ExpoDevice ? ExpoDevice.productName : null;
  platformApi = ExpoDevice ? ExpoDevice.platformApiLevel : null;
}
export const osBuildFingerprint = fingerprint;
export const modelName = model;
export const modelId = platformModelId;
export const designName = platformDesignName;
export const productName = platformProductName;
export const platformApiLevel = platformApi;
export const osName = ExpoDevice ? ExpoDevice.osName : null;
export const totalMemory = ExpoDevice ? ExpoDevice.totalMemory : null;
export const isDevice = ExpoDevice ? ExpoDevice.isDevice : null;
export const supportedCpuArchitectures = ExpoDevice ? ExpoDevice.supportedCpuArchitectures : null;
export const osBuildId = ExpoDevice ? ExpoDevice.osBuildId : null;
export const osVersion = ExpoDevice ? ExpoDevice.osVersion : null;
export const deviceName = ExpoDevice ? ExpoDevice.deviceName : null;
export const osInternalBuildId = ExpoDevice ? ExpoDevice.osInternalBuildId : null;
export const deviceYearClass = ExpoDevice ? ExpoDevice.deviceYearClass: null;

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
  let maxMemory = await ExpoDevice.getMaxMemoryAsync();
  if (maxMemory === -1) {
    maxMemory = Number.MAX_SAFE_INTEGER;
  }
  return Promise.resolve(maxMemory);
}

export async function isSideLoadingEnabledAsync(): Promise<boolean> {
  if (!ExpoDevice.isSideLoadingEnabledAsync) {
    throw new UnavailabilityError('expo-device', 'isSideLoadingEnabledAsync');
  }
  return await ExpoDevice.isSideLoadingEnabledAsync();
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

export async function getDeviceTypeAsync(): Promise<_DeviceType> {
  if (!ExpoDevice.getDeviceTypeAsync) {
    throw new UnavailabilityError('expo-device', 'getDeviceTypeAsync');
  }
  const deviceType = await ExpoDevice.getDeviceTypeAsync();
  switch (deviceType) {
    case _DeviceType.PHONE:
      return _DeviceType.PHONE;
    case _DeviceType.TABLET:
      return _DeviceType.TABLET;
    case _DeviceType.TV:
      return _DeviceType.TV;
    case _DeviceType.DESKTOP:
      return _DeviceType.DESKTOP;
    default:
      return _DeviceType.UNKNOWN;
  }
}
