import { NetworkState, NetworkStateType } from './Network.types';
export { NetworkState, NetworkStateType };
export declare function getNetworkStateAsync(): Promise<NetworkState>;
export declare function getIpAddressAsync(): Promise<string>;
/**
 * @deprecated getMacAddressAsync has been deprecated and will be removed in a future SDK version.
 * It always returns '02:00:00:00:00:00'.
 */
export declare function getMacAddressAsync(interfaceName?: string | null): Promise<string>;
export declare function isAirplaneModeEnabledAsync(): Promise<boolean>;
