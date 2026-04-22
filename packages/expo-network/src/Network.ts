import { type EventSubscription, UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';

import ExpoNetwork from './ExpoNetwork';
import {
  NetworkSignalStrengthEvent,
  NetworkState,
  NetworkStateEvent,
  NetworkStateType,
} from './Network.types';

export { NetworkSignalStrengthEvent, NetworkState, NetworkStateEvent, NetworkStateType };

export const INVALID_SIGNAL_STRENGTH = -1;

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

/**
 * Gets the current cellular signal strength on Android.
 * @platform android
 * @returns A promise fulfilled with a number in the range [0, 4], or `INVALID_SIGNAL_STRENGTH` if
 *   unavailable.
 */
export async function getCellSignalStrengthAsync(): Promise<number> {
  if (!ExpoNetwork.getCellSignalStrengthAsync) {
    throw new UnavailabilityError('expo-network', 'getCellSignalStrengthAsync');
  }
  return await ExpoNetwork.getCellSignalStrengthAsync();
}

/**
 * Gets the current Wi-Fi signal strength on Android.
 * @platform android
 * @returns A promise fulfilled with a number in the range [0, 4], or `INVALID_SIGNAL_STRENGTH` if
 *   unavailable.
 */
export async function getWifiSignalStrengthAsync(): Promise<number> {
  if (!ExpoNetwork.getWifiSignalStrengthAsync) {
    throw new UnavailabilityError('expo-network', 'getWifiSignalStrengthAsync');
  }
  return await ExpoNetwork.getWifiSignalStrengthAsync();
}

/**
 * Adds a listener that fires whenever the cellular signal strength changes.
 * @platform android
 */
export function addCellSignalStrengthListener(
  listener: (event: NetworkSignalStrengthEvent) => void
): EventSubscription {
  return ExpoNetwork.addListener('onCellSignalStrengthChanged', listener);
}

/**
 * Adds a listener that fires whenever the Wi-Fi signal strength changes.
 * @platform android
 */
export function addWifiSignalStrengthListener(
  listener: (event: NetworkSignalStrengthEvent) => void
): EventSubscription {
  return ExpoNetwork.addListener('onWifiSignalStrengthChanged', listener);
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

/**
 * Returns the current cellular signal strength and subscribes to updates.
 * The value is in the range [0, 4], or -1 if unavailable.
 * @platform android
 */
export function useCellSignalStrength(): number {
  const [strength, setStrength] = useState<number>(INVALID_SIGNAL_STRENGTH);

  useEffect(() => {
    getCellSignalStrengthAsync()
      .then(setStrength)
      .catch(() => setStrength(INVALID_SIGNAL_STRENGTH));
    const listener = addCellSignalStrengthListener(({ strength }) => setStrength(strength));
    return () => listener.remove();
  }, []);

  return strength;
}

/**
 * Returns the current Wi-Fi signal strength and subscribes to updates.
 * The value is in the range [0, 4], or -1 if unavailable.
 * @platform android
 */
export function useWifiSignalStrength(): number {
  const [strength, setStrength] = useState<number>(INVALID_SIGNAL_STRENGTH);

  useEffect(() => {
    getWifiSignalStrengthAsync()
      .then(setStrength)
      .catch(() => setStrength(INVALID_SIGNAL_STRENGTH));
    const listener = addWifiSignalStrengthListener(({ strength }) => setStrength(strength));
    return () => listener.remove();
  }, []);

  return strength;
}

/**
 * Returns the signal strength of the currently active network and subscribes to updates.
 * Automatically switches between cellular and Wi-Fi signal strength as the active network changes.
 * The value is in the range [0, 4], or -1 if the active network type does not support signal
 * strength (for example, Ethernet or VPN) or if the value is unavailable.
 * @platform android
 */
export function useActiveSignalStrength(): number {
  const { type } = useNetworkState();
  const [strength, setStrength] = useState<number>(INVALID_SIGNAL_STRENGTH);

  useEffect(() => {
    let getStrength: (() => Promise<number>) | null = null;
    let addListener:
      | ((listener: (event: NetworkSignalStrengthEvent) => void) => EventSubscription)
      | null = null;

    if (type === NetworkStateType.CELLULAR) {
      getStrength = getCellSignalStrengthAsync;
      addListener = addCellSignalStrengthListener;
    } else if (type === NetworkStateType.WIFI) {
      getStrength = getWifiSignalStrengthAsync;
      addListener = addWifiSignalStrengthListener;
    }

    if (!getStrength || !addListener) {
      setStrength(INVALID_SIGNAL_STRENGTH);
      return;
    }

    getStrength()
      .then(setStrength)
      .catch(() => setStrength(INVALID_SIGNAL_STRENGTH));
    const subscription = addListener(({ strength }) => setStrength(strength));
    return () => subscription.remove();
  }, [type]);

  return strength;
}
