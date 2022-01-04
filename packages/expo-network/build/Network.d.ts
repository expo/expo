import { NetworkState, NetworkStateType } from './Network.types';
export { NetworkState, NetworkStateType };
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
 * Gets the specified network interface's MAC address.
 *
 * > Beginning with iOS 7 and Android 11, non-system applications can no longer access the device's
 * MAC address. In SDK 41 and above, this method will always resolve to a predefined value that
 * isn't useful.
 *
 * If you need to identify the device, use the `getIosIdForVendorAsync()` method / `androidId`
 * property of the `expo-application` unimodule instead.
 *
 * @deprecated This method is deprecated and will be removed in a future SDK version.
 *
 * @param interfaceName A string representing interface name (`eth0`, `wlan0`) or `null` (default),
 * meaning the method should fetch the MAC address of the first available interface.
 *
 * @return A `Promise` that fulfils with the value `'02:00:00:00:00:00'`.
 */
export declare function getMacAddressAsync(interfaceName?: string | null): Promise<string>;
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
//# sourceMappingURL=Network.d.ts.map