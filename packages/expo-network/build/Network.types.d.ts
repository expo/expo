export declare type NetworkState = {
    type?: NetworkStateType;
    isConnected?: boolean;
    isInternetReachable?: boolean;
};
export declare enum NetworkStateType {
    NONE = "NONE",
    UNKNOWN = "UNKNOWN",
    CELLULAR = "CELLULAR",
    WIFI = "WIFI",
    BLUETOOTH = "BLUETOOTH",
    ETHERNET = "ETHERNET",
    WIMAX = "WIMAX",
    VPN = "VPN",
    OTHER = "OTHER"
}
