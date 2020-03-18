import { Platform, UnavailabilityError, CodedError } from '@unimodules/core';

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

export async function getMacAddressAsync(interfaceName?: string | null): Promise<string> {
  if (!ExpoNetwork.getMacAddressAsync) {
    throw new UnavailabilityError('expo-network', 'getMacAddressAsync');
  }
  if (Platform.OS === 'android') {
    if (interfaceName === undefined) {
      throw new CodedError(
        'ERR_NETWORK_UNDEFINED_INTERFACE',
        "Passing undefined as interface name is not supported on Android. Pass in explicit null if you don't care for which interface the MAC address will be returned."
      );
    }
    return await ExpoNetwork.getMacAddressAsync(interfaceName);
  } else {
    return await ExpoNetwork.getMacAddressAsync();
  }
}

export async function isAirplaneModeEnabledAsync(): Promise<boolean> {
  if (!ExpoNetwork.isAirplaneModeEnabledAsync) {
    throw new UnavailabilityError('expo-network', 'isAirplaneModeEnabledAsync');
  }
  return await ExpoNetwork.isAirplaneModeEnabledAsync();
}
