import { type EventSubscription, UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';

import ExpoNetwork from './ExpoNetwork';
import { NetworkState, NetworkStateEvent, NetworkStateType } from './Network.types';

export { NetworkState, NetworkStateEvent, NetworkStateType };

const onNetworkStateEventName = 'onNetworkStateChanged';

// @needsAudit
/**
 * Gets the device's current network connection state.
 *
 * On web, `navigator.connection.type` is not available on browsers. So if there is an active
 * network connection, the field `type` returns `NetworkStateType.UNKNOWN`. Otherwise, it returns
 * `NetworkStateType.NONE`.
 * @return A `Promise` that fulfils with a `NetworkState` object.
 *
 * @example
 * ```ts
 * await Network.getNetworkStateAsync();
 * // {
 * //   type: NetworkStateType.CELLULAR,
 * //   isConnected: true,
 * //   isInternetReachable: true,
 * // }
 * ```
 */
export async function getNetworkStateAsync(): Promise<NetworkState> {
  if (!ExpoNetwork.getNetworkStateAsync) {
    throw new UnavailabilityError('expo-network', 'getNetworkStateAsync');
  }
  return await ExpoNetwork.getNetworkStateAsync();
}

// @needsAudit
/**
 * Gets the device's current IPv4 address. Returns `0.0.0.0` if the IP address could not be retrieved.
 *
 * On web, this method uses the third-party [`ipify service`](https://www.ipify.org/) to get the
 * public IP address of the current device.
 * @return A `Promise` that fulfils with a `string` of the current IP address of the device's main
 * network interface. Can only be IPv4 address.
 *
 * @example
 * ```ts
 * await Network.getIpAddressAsync();
 * // "92.168.32.44"
 * ```
 */
export async function getIpAddressAsync(): Promise<string> {
  if (!ExpoNetwork.getIpAddressAsync) {
    throw new UnavailabilityError('expo-network', 'getIpAddressAsync');
  }
  return await ExpoNetwork.getIpAddressAsync();
}

// @needsAudit
/**
 * Tells if the device is in airplane mode.
 * @return Returns a `Promise` that fulfils with a `boolean` value for whether the device is in
 * airplane mode or not.
 * @platform android
 *
 * @example
 * ```ts
 * await Network.isAirplaneModeEnabledAsync();
 * // false
 * ```
 */
export async function isAirplaneModeEnabledAsync(): Promise<boolean> {
  if (!ExpoNetwork.isAirplaneModeEnabledAsync) {
    throw new UnavailabilityError('expo-network', 'isAirplaneModeEnabledAsync');
  }
  return await ExpoNetwork.isAirplaneModeEnabledAsync();
}

/**
 * Adds a listener that will fire whenever the network state changes.
 *
 * @param listener Callback to execute when the network state changes. The callback is provided with
 * a single argument that is an object containing information about the network state.
 *
 * @example
 * ```ts
 * const subscription = addNetworkStateListener(({ type, isConnected, isInternetReachable }) => {
 *   console.log(`Network type: ${type}, Connected: ${isConnected}, Internet Reachable: ${isInternetReachable}`);
 * });
 * ```
 *
 * @returns A subscription object with a remove function to unregister the listener.
 */
export function addNetworkStateListener(
  listener: (event: NetworkStateEvent) => void
): EventSubscription {
  return ExpoNetwork.addListener(onNetworkStateEventName, listener);
}

// @needsAudit
/**
 * Returns the current network state of the device. This method
 * initiates a listener for network state changes and cleans up before unmounting.
 *
 * @example
 * ```ts
 * const networkState = useNetworkState();
 * console.log(`Current network type: ${networkState.type}`);
 * ```
 *
 * @return The current network state of the device, including connectivity and type.
 */
export function useNetworkState(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({});

  useEffect(() => {
    getNetworkStateAsync().then(setNetworkState);
    const listener = addNetworkStateListener((networkState) => setNetworkState(networkState));
    return () => listener.remove();
  }, []);

  return networkState;
}
