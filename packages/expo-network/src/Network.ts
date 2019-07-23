import { Platform, UnavailabilityError } from '@unimodules/core';

import ExpoNetwork from './ExpoNetwork';

export async function getIpAddressAsync(): Promise<string> {
  if (!ExpoNetwork.getIpAddressAsync) {
    throw new UnavailabilityError('expo-network', 'getIpAddressAsync');
  }
  return await ExpoNetwork.getIpAddressAsync();
}

export async function getMacAddressAsync(): Promise<string> {
  if (!ExpoNetwork.getMacAddressAsync) {
    throw new UnavailabilityError('expo-network', 'getMacAddressAsync');
  }
  return await ExpoNetwork.getMacAddressAsync();
}

export async function isAirplaneModeEnableAsync(): Promise<boolean> {
  if (!ExpoNetwork.isAirplaneModeEnableAsync) {
    throw new UnavailabilityError('expo-network', 'isAirplaneModeEnableAsync');
  }
  return await ExpoNetwork.isAirplaneModeEnableAsync();
}