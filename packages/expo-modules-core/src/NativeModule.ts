import { ensureNativeModulesAreInstalled } from './requireNativeModule';

ensureNativeModulesAreInstalled();

export default globalThis.expo.NativeModule;
