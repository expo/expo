import ExpoDevice from './ExpoDevice';

import { devicesWithNotch, deviceNamesByCode } from './DeviceConstants';

import { Platform, UnavailabilityError } from '@unimodules/core';

export const brand = ExpoDevice ? ExpoDevice.brand : null;
export const manufacturer = ExpoDevice ? ExpoDevice.manufacturer : null;
if (Platform.OS === 'ios') {
  var modelName;
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
  modelName = deviceName;
} else {
  modelName = ExpoDevice ? ExpoDevice.model : null;
}
export const model = modelName;
export const phoneNumber = ExpoDevice ? ExpoDevice.phoneNumber : null;
export const serialNumber = ExpoDevice ? ExpoDevice.serialNumber : null;
export const systemName = ExpoDevice ? ExpoDevice.systemName : null;
export const totalMemory = ExpoDevice ? ExpoDevice.totalMemory : null;
export const uniqueId = ExpoDevice ? ExpoDevice.uniqueId : null;
export const isTablet = ExpoDevice ? ExpoDevice.isTablet : null;
export const deviceType = ExpoDevice ? ExpoDevice.deviceType : null;
export const deviceId = ExpoDevice ? ExpoDevice.deviceId : null;
export const totalDiskCapacity = ExpoDevice ? ExpoDevice.totalDiskCapacity : null;
export const supportedABIs = ExpoDevice ? ExpoDevice.supportedABIs : null;
export function hasNotch(): boolean {
  return (
    devicesWithNotch.some(
      item =>
        item.brand.toLowerCase() === ExpoDevice.brand.toLowerCase() &&
        item.model.toLowerCase() ===
        (Platform.OS === 'ios' ? modelName.toLowerCase() : ExpoDevice.model.toLowerCase())
    ) 
  );
}
export async function getFreeDiskStorageAsync(): Promise<string> {
  return await ExpoDevice.getFreeDiskStorageAsync();
}

export async function getIPAddressAsync(): Promise<string> {
  return await ExpoDevice.getIPAddressAsync();
}

export async function getMACAddressAsync(): Promise<string> {
  return await ExpoDevice.getMACAddressAsync();
}

export async function isAirplaneModeEnabledAsync(): Promise<boolean | string> {
  if (!ExpoDevice.isAirplaneModeAsync) {
    throw new UnavailabilityError('expo-device', 'isAirplaneModeEnabledAsync');
  }
  return await ExpoDevice.isAirplaneModeEnabledAsync();
}

export async function hasSystemFeatureAsync(feature: string): Promise<boolean> {
  if (!ExpoDevice.hasSystemFeatureAsync) {
    throw new UnavailabilityError('expo-device', 'hasSystemFeatureAsync');
  }
  return await ExpoDevice.hasSystemFeatureAsync(feature);
}

export async function isPinOrFingerprintSetAsync(): Promise<boolean> {
  return await ExpoDevice.isPinOrFingerprintSetAsync();
}

export async function getUserAgentAsync(): Promise<string> {
  return await ExpoDevice.getUserAgentAsync();
}

export async function getCarrierAsync(): Promise<string> {
  return await ExpoDevice.getCarrierAsync();
}
