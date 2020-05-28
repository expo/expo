import { ProxyNativeModule } from './NativeModulesProxy.types';

// We default to an empty object shim wherever we don't have an environment-specific implementation
export default {} as { [moduleName: string]: ProxyNativeModule };
