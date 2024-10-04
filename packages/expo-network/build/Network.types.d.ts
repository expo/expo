export type NetworkState = {
    /**
     * A [`NetworkStateType`](#networkstatetype) enum value that represents the current network
     * connection type.
     */
    type?: NetworkStateType;
    /**
     * If there is an active network connection. Note that this does not mean that internet is reachable.
     * This field is `false` if the type is either `Network.NetworkStateType.NONE` or `Network.NetworkStateType.UNKNOWN`,
     * `true` otherwise.
     */
    isConnected?: boolean;
    /**
     * If the internet is reachable with the currently active network connection. On Android, this
     * depends on `NetInfo.isConnected()` (API level < 29) or `ConnectivityManager.getActiveNetwork()`
     * (API level >= 29). On iOS, this value will always be the same as `isConnected`.
     */
    isInternetReachable?: boolean;
};
/**
 * An enum of the different types of devices supported by Expo.
 */
export declare enum NetworkStateType {
    /**
     * No active network connection detected.
     */
    NONE = "NONE",
    /**
     * The connection type could not be determined.
     */
    UNKNOWN = "UNKNOWN",
    /**
     * Active network connection over mobile data or [`DUN-specific`](https://developer.android.com/reference/android/net/ConnectivityManager#TYPE_MOBILE_DUN)
     * mobile connection when setting an upstream connection for tethering.
     * @platform android
     * @platform ios
     */
    CELLULAR = "CELLULAR",
    /**
     * Active network connection over Wi-Fi.
     * @platform android
     * @platform ios
     */
    WIFI = "WIFI",
    /**
     * Active network connection over Bluetooth.
     * @platform android
     */
    BLUETOOTH = "BLUETOOTH",
    /**
     * Active network connection over Ethernet.
     * @platform android
     * @platform ios
     */
    ETHERNET = "ETHERNET",
    /**
     * Active network connection over WiMAX.
     * @platform android
     */
    WIMAX = "WIMAX",
    /**
     * Active network connection over VPN.
     * @platform android
     */
    VPN = "VPN",
    /**
     * Active network connection over other network connection types.
     * @platform android
     */
    OTHER = "OTHER"
}
/**
 * Represents an event that provides the updated network state when there is a change in the network status.
 * This is passed as the argument to listeners registered with [`addNetworkStateListener()`](#networkaddnetworkstatelistenerlistener).
 */
export type NetworkStateEvent = NetworkState;
/**
 * @hidden
 */
export type NetworkEvents = {
    onNetworkStateChanged(event: NetworkStateEvent): any;
};
//# sourceMappingURL=Network.types.d.ts.map