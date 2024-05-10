import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { NativeModule } from './ts-declarations/NativeModule';

ensureNativeModulesAreInstalled();

function getNativeModule(): typeof NativeModule {
  if (typeof window !== 'undefined' && globalThis.expo?.NativeModule) {
    return globalThis.expo.NativeModule as typeof NativeModule;
  } else {
    return {} as typeof NativeModule;
  }
}

export default getNativeModule();
