// Installs the expo global on web
import './polyfill';

/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */
export function ensureNativeModulesAreInstalled(): void {
  // No-op on web
}
