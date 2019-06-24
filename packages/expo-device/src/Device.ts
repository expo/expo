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
export const phoneNumber = ExpoDevice.phoneNumber;
export const serialNumber = ExpoDevice.serialNumber;
export const systemName = ExpoDevice.systemName;
export const totalMemory = ExpoDevice.totalMemory;
export const uniqueId = ExpoDevice.uniqueId;
export const isTablet = ExpoDevice.isTablet;
export const deviceType = ExpoDevice.deviceType;
export const deviceId = ExpoDevice.deviceId;
export const supportedABIs = ExpoDevice.supportedABIs;
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

export async function getMACAddressAsync(interfaceName: string): Promise<string> {
  if(Platform.OS === "ios"){
    return await ExpoDevice.getMACAddressAsync();
  }
  else{
    return await ExpoDevice.getMACAddressAsync(interfaceName);
  }
}

export async function isAirplaneModeEnabledAsync(): Promise<boolean | string> {
  if (!ExpoDevice.isAirplaneModeEnabledAsync) {
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

export async function getTotalDiskCapacityAsync(): Promise<string> {
  return await ExpoDevice.getTotalDiskCapacityAsync();
}
