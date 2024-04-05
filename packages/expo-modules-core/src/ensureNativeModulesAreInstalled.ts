import { NativeModules, Platform } from 'react-native';

/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */
export function ensureNativeModulesAreInstalled(): void {
  if (globalThis.expo) {
    return;
  }
  try {
    if (Platform.OS === 'web') {
      // Requiring web folder sets up the `globalThis.expo` object.
      require('./web');
    } else {
      // TODO: ExpoModulesCore shouldn't be optional here,
      // but to keep backwards compatibility let's just ignore it in SDK 50.
      // In most cases the modules were already installed from the native side.
      NativeModules.ExpoModulesCore?.installModules();
    }
  } catch (error) {
    console.error(`Unable to install Expo modules: ${error}`);
  }
}
