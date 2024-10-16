import { registerWebGlobals } from './web';

/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */
export function ensureNativeModulesAreInstalled(): void {
  if (globalThis.expo) return;

  try {
    registerWebGlobals();
  } catch (error) {
    console.error(`Unable to install Expo modules: ${error}`);
  }
}
