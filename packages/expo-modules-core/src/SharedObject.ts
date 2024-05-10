import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { SharedObject } from './ts-declarations/SharedObject';

ensureNativeModulesAreInstalled();

function getSharedObject(): typeof SharedObject {
  if (typeof window !== 'undefined' && globalThis.expo?.SharedObject) {
    return globalThis.expo.SharedObject as typeof SharedObject;
  } else {
    return {} as typeof SharedObject;
  }
}

export default getSharedObject();
