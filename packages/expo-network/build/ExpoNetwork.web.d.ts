import { NativeModule } from 'expo-modules-core';
import { NetworkEvents, NetworkState } from './Network.types';
declare class ExpoNetworkModule extends NativeModule<NetworkEvents> {
    eventListener?: () => void;
    updateNetworkState(): void;
    getIpAddressAsync(): Promise<string>;
    getNetworkStateAsync(): Promise<NetworkState>;
    isAirplaneModeEnabledAsync(): Promise<boolean>;
    startObserving(): void;
    stopObserving(): void;
}
declare const _default: typeof ExpoNetworkModule;
export default _default;
//# sourceMappingURL=ExpoNetwork.web.d.ts.map