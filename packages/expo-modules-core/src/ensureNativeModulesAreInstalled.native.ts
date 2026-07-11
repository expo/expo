import { TurboModuleRegistry } from 'react-native';

import { installExpoGlobalPolyfill } from './polyfill/dangerous-internal';

/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */
export function ensureNativeModulesAreInstalled(): void {
  if (globalThis.expo || typeof window === 'undefined') {
    return;
  }

  try {
    // TODO: ExpoModulesCore shouldn't be optional here,
    // but to keep backwards compatibility let's just ignore it in SDK 50.
    // In most cases the modules were already installed from the native side.
    const nativeExpoModulesCore = TurboModuleRegistry.get('ExpoModulesCore') as {
      installModules: () => void;
    } | null;

    if (nativeExpoModulesCore) {
      nativeExpoModulesCore.installModules();
    } else {
      // No native `ExpoModulesCore` module exists in this runtime -- true on
      // platforms with a JS-only React Native host (e.g. react-native-windows;
      // there's no Windows port of the ExpoModulesCore native module yet), as
      // opposed to iOS/Android where a missing module here would be a real
      // installation problem. Fall back to the same pure-JS polyfill `web`
      // already uses for the same reason (see `polyfill/index.web.ts`), so the
      // `EventEmitter`/`NativeModule`/`SharedObject` base classes this package
      // itself exports exist. Without this, `globalThis.expo` is left
      // `undefined` and importing this package crashes immediately with
      // `Cannot read properties of undefined (reading 'EventEmitter')` --
      // instead of the individual `requireNativeModule()` call for a specific
      // module throwing/returning `null`, which callers can already handle.
      installExpoGlobalPolyfill();
    }
  } catch (error) {
    console.error(`Unable to install Expo modules: ${error}`);
  }
}
