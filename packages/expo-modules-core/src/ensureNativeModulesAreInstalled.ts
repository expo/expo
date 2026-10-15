import { installExpoGlobalPolyfill } from './polyfill/dangerous-internal';

/**
 * Ensures that the native modules are installed in the current runtime.
 */
export function ensureNativeModulesAreInstalled(): void {
  installExpoGlobalPolyfill();
}
