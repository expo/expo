import { NativeModules } from 'react-native';

import { ProxyNativeModule } from './NativeModulesProxy.types';

const LegacyNativeProxy = NativeModules.NativeUnimoduleProxy;
// Fixes `cannot find name 'global'.` in tests
// @ts-ignore
const ExpoNativeProxy = global.expo?.modules?.NativeModulesProxy;

const modulesConstantsKey = 'modulesConstants';
const exportedMethodsKey = 'exportedMethods';

const NativeModulesProxy: { [moduleName: string]: ProxyNativeModule } = {};

if (LegacyNativeProxy) {
  // use JSI proxy if available, fallback to legacy RN proxy
  const NativeProxy = ExpoNativeProxy ?? LegacyNativeProxy;

  Object.keys(NativeProxy[exportedMethodsKey]).forEach((moduleName) => {
    // copy constants
    NativeModulesProxy[moduleName] = NativeProxy[modulesConstantsKey][moduleName] || {};

    // copy methods
    NativeProxy[exportedMethodsKey][moduleName].forEach((methodInfo) => {
      NativeModulesProxy[moduleName][methodInfo.name] = (...args: unknown[]): Promise<any> => {
        // Use the new proxy to call methods on legacy modules, if possible.
        if (ExpoNativeProxy?.callMethod) {
          return ExpoNativeProxy.callMethod(moduleName, methodInfo.name, args);
        }

        // Otherwise fall back to the legacy proxy.
        // This is deprecated and might be removed in SDK47 or later.
        const { key, argumentsCount } = methodInfo;
        if (argumentsCount !== args.length) {
          return Promise.reject(
            new Error(
              `Native method ${moduleName}.${methodInfo.name} expects ${argumentsCount} ${
                argumentsCount === 1 ? 'argument' : 'arguments'
              } but received ${args.length}`
            )
          );
        }
        return LegacyNativeProxy.callMethod(moduleName, key, args);
      };
    });

    // These are called by EventEmitter (which is a wrapper for NativeEventEmitter)
    // only on iOS and they use iOS-specific native module, EXReactNativeEventEmitter.
    //
    // On Android only {start,stop}Observing are called on the native module
    // and these should be exported as Expo methods.
    //
    // Before the RN 65, addListener/removeListeners weren't called on Android. However, it no longer stays true.
    // See https://github.com/facebook/react-native/commit/f5502fbda9fe271ff6e1d0da773a3a8ee206a453.
    // That's why, we check if the `EXReactNativeEventEmitter` exists and only if yes, we use it in the listener implementation.
    // Otherwise, those methods are NOOP.
    if (NativeModules.EXReactNativeEventEmitter) {
      NativeModulesProxy[moduleName].addListener = (...args) =>
        NativeModules.EXReactNativeEventEmitter.addProxiedListener(moduleName, ...args);
      NativeModulesProxy[moduleName].removeListeners = (...args) =>
        NativeModules.EXReactNativeEventEmitter.removeProxiedListeners(moduleName, ...args);
    } else {
      // Fixes on Android:
      // WARN  `new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.
      // WARN  `new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.
      NativeModulesProxy[moduleName].addListener = () => {};
      NativeModulesProxy[moduleName].removeListeners = () => {};
    }
  });
} else {
  console.warn(
    `The "EXNativeModulesProxy" native module is not exported through NativeModules; verify that expo-modules-core's native code is linked properly`
  );
}

export default NativeModulesProxy;
