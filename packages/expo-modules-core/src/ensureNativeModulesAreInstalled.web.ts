import { registerWebGlobals } from './web';

/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */
export function ensureNativeModulesAreInstalled(): void {
  // Requiring web folder sets up the `globalThis.expo` object.
  registerWebGlobals();
}
