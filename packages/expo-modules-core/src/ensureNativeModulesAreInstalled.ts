import { TurboModuleRegistry } from 'react-native';

// Installs the expo global on web
import './polyfill';

/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */
export function ensureNativeModulesAreInstalled(): void {
  if (globalThis.expo) {
    return;
  }
  try {
    if (process.env.EXPO_OS !== 'web') {
      // TODO: ExpoModulesCore shouldn't be optional here,
      // but to keep backwards compatibility let's just ignore it in SDK 50.
      // In most cases the modules were already installed from the native side.
      (
        TurboModuleRegistry.get('ExpoModulesCore') as { installModules: () => void } | null
      )?.installModules();
    }
  } catch (error) {
    console.error(`Unable to install Expo modules: ${error}`);
  }
}
