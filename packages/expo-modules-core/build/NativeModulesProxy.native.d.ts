import { ProxyNativeModule } from './NativeModulesProxy.types';
declare const NativeModulesProxy: {
    [moduleName: string]: ProxyNativeModule;
};
/**
 * Sets whether to use a TurboModule version of the proxy.
 */
export declare function useExpoTurboModules(state?: boolean): void;
export default NativeModulesProxy;
