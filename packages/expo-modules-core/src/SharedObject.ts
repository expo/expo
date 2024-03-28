import { ensureNativeModulesAreInstalled } from './requireNativeModule';

ensureNativeModulesAreInstalled();

export default globalThis.expo.SharedObject;
