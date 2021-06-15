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
     */
    NetworkStateType["CELLULAR"] = "CELLULAR";
    /**
     * Active network connection over WiFi.
     */
    NetworkStateType["WIFI"] = "WIFI";
    /**
     * Active network connection over Bluetooth.
     */
    NetworkStateType["BLUETOOTH"] = "BLUETOOTH";
    /**
     * Active network connection over Ethernet.
     */
    NetworkStateType["ETHERNET"] = "ETHERNET";
    /**
     * Active network connection over Wimax.
     */
    NetworkStateType["WIMAX"] = "WIMAX";
    /**
     * Active network connection over VPN.
     */
    NetworkStateType["VPN"] = "VPN";
    /**
     * Active network connection over other network connection types.
     */
    NetworkStateType["OTHER"] = "OTHER";
})(NetworkStateType || (NetworkStateType = {}));
//# sourceMappingURL=Network.types.js.map