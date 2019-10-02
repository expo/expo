import { Platform, UnavailabilityError } from '@unimodules/core';

import { DeviceType } from './Device.types';
import ExpoDevice from './ExpoDevice';
import { getIosModelName } from './ModelNames';

export { DeviceType };

export const isDevice: boolean = ExpoDevice ? ExpoDevice.isDevice : true;
export const brand: string | null = ExpoDevice ? ExpoDevice.brand : null;
export const manufacturer: string | null = ExpoDevice ? ExpoDevice.manufacturer : null;
export const modelId = ExpoDevice ? ExpoDevice.modelId || null : null;
export const modelName: string | null = ExpoDevice
  ? Platform.OS === 'ios' && ExpoDevice.modelId
    ? getIosModelName(ExpoDevice.modelId)
    : ExpoDevice.modelName
  : null;
export const designName: string | null = ExpoDevice ? ExpoDevice.designName || null : null;
export const productName: string | null = ExpoDevice ? ExpoDevice.productName || null : null;
export const deviceYearClass: number | null = ExpoDevice ? ExpoDevice.deviceYearClass : null;
export const totalMemory: number | null = ExpoDevice ? ExpoDevice.totalMemory : null;
export const supportedCpuArchitectures: string[] | null = ExpoDevice
  ? ExpoDevice.supportedCpuArchitectures
  : null;
export const osName: string | null = ExpoDevice ? ExpoDevice.osName : null;
export const osVersion: string | null = ExpoDevice ? ExpoDevice.osVersion : null;
export const osBuildId: string | null = ExpoDevice ? ExpoDevice.osBuildId : null;
export const osInternalBuildId: string | null = ExpoDevice ? ExpoDevice.osInternalBuildId : null;
export const osBuildFingerprint: string | null = ExpoDevice
  ? ExpoDevice.osBuildFingerprint || null
  : null;
export const platformApiLevel: number | null = ExpoDevice
  ? ExpoDevice.platformApiLevel || null
  : null;
export const deviceName: string | null = ExpoDevice ? ExpoDevice.deviceName : null;

export async function getDeviceTypeAsync(): Promise<DeviceType> {
  if (!ExpoDevice.getDeviceTypeAsync) {
    throw new UnavailabilityError('expo-device', 'getDeviceTypeAsync');
  }
  return await ExpoDevice.getDeviceTypeAsync();
}

export async function getUptimeAsync(): Promise<number> {
  if (!ExpoDevice.getUptimeAsync) {
    throw new UnavailabilityError('expo-device', 'getUptimeAsync');
  }
  return await ExpoDevice.getUptimeAsync();
}

export async function getMaxMemoryAsync(): Promise<number> {
  if (!ExpoDevice.getMaxMemoryAsync) {
    throw new UnavailabilityError('expo-device', 'getMaxMemoryAsync');
  }
  let maxMemory = await ExpoDevice.getMaxMemoryAsync();
  if (maxMemory === -1) {
    maxMemory = Number.MAX_SAFE_INTEGER;
  }
  return maxMemory;
}

export async function isRootedExperimentalAsync(): Promise<boolean> {
  if (!ExpoDevice.isRootedExperimentalAsync) {
    throw new UnavailabilityError('expo-device', 'isRootedExperimentalAsync');
  }
  return await ExpoDevice.isRootedExperimentalAsync();
}

export async function isSideLoadingEnabledAsync(): Promise<boolean> {
  if (!ExpoDevice.isSideLoadingEnabledAsync) {
    throw new UnavailabilityError('expo-device', 'isSideLoadingEnabledAsync');
  }
  return await ExpoDevice.isSideLoadingEnabledAsync();
}

export async function getPlatformFeaturesAsync(): Promise<string[]> {
  if (!ExpoDevice.getPlatformFeaturesAsync) {
    return [];
  }
  return await ExpoDevice.getPlatformFeaturesAsync();
}

export async function hasPlatformFeatureAsync(feature: string): Promise<boolean> {
  if (!ExpoDevice.hasPlatformFeatureAsync) {
    return false;
  }
  return await ExpoDevice.hasPlatformFeatureAsync(feature);
}
