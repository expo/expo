import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { SharedObject } from './ts-declarations/SharedObject';

ensureNativeModulesAreInstalled();

export default globalThis.expo.SharedObject as typeof SharedObject;
