import { Platform, UnavailabilityError } from '@unimodules/core';

import ExpoDevice from './ExpoDevice';
import { deviceNamesByCode } from './DeviceNameByCode';

export enum DeviceType {
  PHONE = 'PHONE',
  TABLET = 'TABLET',
  DESKTOP = 'DESKTOP',
  TV = 'TV',
  UNKNOWN = 'UNKNOWN',
}

export let modelName;
if (Platform.OS === 'ios') {
  let IosDeviceName;
  let IosModelId = ExpoDevice.modelId;
  if (IosModelId) {
    IosDeviceName = deviceNamesByCode[IosModelId];
    if (!IosDeviceName) {
      // Not found on database. At least guess main device type from string contents:
      if (IosModelId.startsWith('iPod')) {
        IosDeviceName = 'iPod Touch';
      } else if (IosModelId.startsWith('iPad')) {
        IosDeviceName = 'iPad';
      } else if (IosModelId.startsWith('iPhone')) {
        IosDeviceName = 'iPhone';
      } else if (IosModelId.startsWith('AppleTV')) {
        IosDeviceName = 'Apple TV';
      }
    }
  }
  modelName = IosDeviceName;
}
if (!modelName) modelName = ExpoDevice ? ExpoDevice.modelName : null;
export const modelId = ExpoDevice ? (ExpoDevice.modelId ? ExpoDevice.modelId : null) : null;
export const osBuildFingerprint = ExpoDevice
  ? ExpoDevice.osBuildFingerprint
    ? ExpoDevice.osBuildFingerprint
    : null
  : null;
export const designName = ExpoDevice
  ? ExpoDevice.designName
    ? ExpoDevice.designName
    : null
  : null;
export const productName = ExpoDevice
  ? ExpoDevice.productName
    ? ExpoDevice.productName
    : null
  : null;
export const platformApiLevel = ExpoDevice
  ? ExpoDevice.platformApiLevel
    ? ExpoDevice.platformApiLevel
    : null
  : null;
export const brand = ExpoDevice ? ExpoDevice.brand : null;
export const manufacturer = ExpoDevice ? ExpoDevice.manufacturer : null;
export const osName = ExpoDevice ? ExpoDevice.osName : null;
export const totalMemory = ExpoDevice ? ExpoDevice.totalMemory : null;
export const isDevice = ExpoDevice ? ExpoDevice.isDevice : null;
export const supportedCpuArchitectures = ExpoDevice ? ExpoDevice.supportedCpuArchitectures : null;
export const osBuildId = ExpoDevice ? ExpoDevice.osBuildId : null;
export const osVersion = ExpoDevice ? ExpoDevice.osVersion : null;
export const deviceName = ExpoDevice ? ExpoDevice.deviceName : null;
export const osInternalBuildId = ExpoDevice ? ExpoDevice.osInternalBuildId : null;
export const deviceYearClass = ExpoDevice ? ExpoDevice.deviceYearClass : null;

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

export async function getDeviceTypeAsync(): Promise<DeviceType> {
  if (!ExpoDevice.getDeviceTypeAsync) {
    throw new UnavailabilityError('expo-device', 'getDeviceTypeAsync');
  }
  const deviceType = await ExpoDevice.getDeviceTypeAsync();
  switch (deviceType) {
    case DeviceType.PHONE:
      return DeviceType.PHONE;
    case DeviceType.TABLET:
      return DeviceType.TABLET;
    case DeviceType.TV:
      return DeviceType.TV;
    case DeviceType.DESKTOP:
      return DeviceType.DESKTOP;
    default:
      return DeviceType.UNKNOWN;
  }
}
