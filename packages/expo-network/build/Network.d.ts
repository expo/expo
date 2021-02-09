import { NetworkState, NetworkStateType } from './Network.types';
export { NetworkState, NetworkStateType };
export declare function getNetworkStateAsync(): Promise<NetworkState>;
export declare function getIpAddressAsync(): Promise<string>;
export declare function getMacAddressAsync(interfaceName?: string | null): Promise<string>;
export declare function isAirplaneModeEnabledAsync(): Promise<boolean>;
