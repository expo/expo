import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { NativeModule } from './ts-declarations/NativeModule';

ensureNativeModulesAreInstalled();

export default globalThis.expo.NativeModule as typeof NativeModule;
