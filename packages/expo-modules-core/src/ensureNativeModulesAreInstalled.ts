import { installExpoGlobalPolyfill } from './polyfill/dangerous-internal';

/**
 * Ensures that the native modules are installed in the current runtime.
 * On web, it installs the `expo` global polyfill.
 */
export function ensureNativeModulesAreInstalled(): void {
  installExpoGlobalPolyfill();
}
