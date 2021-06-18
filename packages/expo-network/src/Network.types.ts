// @needsAudit
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

// @needsAudit
/**
 * An enum of the different types of devices supported by Expo.
 */
export enum NetworkStateType {
  /**
   * No active network connection detected.
   */
  NONE = 'NONE',
  /**
   * The connection type could not be determined.
   */
  UNKNOWN = 'UNKNOWN',
  /**
   * Active network connection over mobile data or [`DUN-specific`](https://developer.android.com/reference/android/net/ConnectivityManager#TYPE_MOBILE_DUN)
   * mobile connection when setting an upstream connection for tethering.
   */
  CELLULAR = 'CELLULAR',
  /**
   * Active network connection over WiFi.
   */
  WIFI = 'WIFI',
  /**
   * Active network connection over Bluetooth.
   */
  BLUETOOTH = 'BLUETOOTH',
  /**
   * Active network connection over Ethernet.
   */
  ETHERNET = 'ETHERNET',
  /**
   * Active network connection over Wimax.
   */
  WIMAX = 'WIMAX',
  /**
   * Active network connection over VPN.
   */
  VPN = 'VPN',
  /**
   * Active network connection over other network connection types.
   */
  OTHER = 'OTHER',
}
