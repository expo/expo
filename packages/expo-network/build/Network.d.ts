import { type EventSubscription } from 'expo-modules-core';
import { NetworkState, NetworkStateEvent, NetworkStateType } from './Network.types';
export { NetworkState, NetworkStateEvent, NetworkStateType };
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
export declare function getNetworkStateAsync(): Promise<NetworkState>;
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
export declare function getIpAddressAsync(): Promise<string>;
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
export declare function isAirplaneModeEnabledAsync(): Promise<boolean>;
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
export declare function addNetworkStateListener(listener: (event: NetworkStateEvent) => void): EventSubscription;
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
export declare function useNetworkState(): NetworkState;
//# sourceMappingURL=Network.d.ts.map