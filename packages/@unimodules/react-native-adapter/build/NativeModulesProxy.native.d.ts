import { ProxyNativeModule } from './NativeModulesProxy.types';
declare const NativeModulesProxy: {
    [moduleName: string]: ProxyNativeModule;
};
export default NativeModulesProxy;
