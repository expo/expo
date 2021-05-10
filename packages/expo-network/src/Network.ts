import { UnavailabilityError } from '@unimodules/core';

import ExpoNetwork from './ExpoNetwork';
import { NetworkState, NetworkStateType } from './Network.types';

export { NetworkState, NetworkStateType };

export async function getNetworkStateAsync(): Promise<NetworkState> {
  if (!ExpoNetwork.getNetworkStateAsync) {
    throw new UnavailabilityError('expo-network', 'getNetworkStateAsync');
  }
  return await ExpoNetwork.getNetworkStateAsync();
}

export async function getIpAddressAsync(): Promise<string> {
  if (!ExpoNetwork.getIpAddressAsync) {
    throw new UnavailabilityError('expo-network', 'getIpAddressAsync');
  }
  return await ExpoNetwork.getIpAddressAsync();
}

/**
 * @deprecated getMacAddressAsync has been deprecated and will be removed in a future SDK version.
 * It always returns '02:00:00:00:00:00'.
 */
export async function getMacAddressAsync(interfaceName: string | null = null): Promise<string> {
  console.warn(
    'Network.getMacAddressAsync has been deprecated and will be removed in a future SDK version. To uniquely identify a device, use the expo-application module instead.'
  );
  return '02:00:00:00:00:00';
}

export async function isAirplaneModeEnabledAsync(): Promise<boolean> {
  if (!ExpoNetwork.isAirplaneModeEnabledAsync) {
    throw new UnavailabilityError('expo-network', 'isAirplaneModeEnabledAsync');
  }
  return await ExpoNetwork.isAirplaneModeEnabledAsync();
}
