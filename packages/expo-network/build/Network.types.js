// @needsAudit
/**
 * An enum of the different types of devices supported by Expo.
 */
export var NetworkStateType;
(function (NetworkStateType) {
    /**
     * No active network connection detected.
     */
    NetworkStateType["NONE"] = "NONE";
    /**
     * The connection type could not be determined.
     */
    NetworkStateType["UNKNOWN"] = "UNKNOWN";
    /**
     * Active network connection over mobile data or [`DUN-specific`](https://developer.android.com/reference/android/net/ConnectivityManager#TYPE_MOBILE_DUN)
     * mobile connection when setting an upstream connection for tethering.
     * @platform android
     * @platform ios
     */
    NetworkStateType["CELLULAR"] = "CELLULAR";
    /**
     * Active network connection over Wi-Fi.
     * @platform android
     * @platform ios
     */
    NetworkStateType["WIFI"] = "WIFI";
    /**
     * Active network connection over Bluetooth.
     * @platform android
     */
    NetworkStateType["BLUETOOTH"] = "BLUETOOTH";
    /**
     * Active network connection over Ethernet.
     * @platform android
     * @platform ios
     */
    NetworkStateType["ETHERNET"] = "ETHERNET";
    /**
     * Active network connection over WiMAX.
     * @platform android
     */
    NetworkStateType["WIMAX"] = "WIMAX";
    /**
     * Active network connection over VPN.
     * @platform android
     */
    NetworkStateType["VPN"] = "VPN";
    /**
     * Active network connection over other network connection types.
     * @platform android
     */
    NetworkStateType["OTHER"] = "OTHER";
})(NetworkStateType || (NetworkStateType = {}));
//# sourceMappingURL=Network.types.js.map