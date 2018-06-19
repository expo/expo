import { NativeModules } from 'react-native';

const NativeProxy = NativeModules.ExpoNativeModuleProxy;
const modulesConstantsKey = "modulesConstants";
const exportedMethodsKey = "exportedMethods";

const NativeModulesProxy = {};

Object.keys(NativeProxy[exportedMethodsKey]).forEach(moduleName => {
  NativeModulesProxy[moduleName] = NativeProxy[modulesConstantsKey][moduleName] || {};
  NativeProxy[exportedMethodsKey][moduleName].forEach(methodInfo => {
    NativeModulesProxy[moduleName][methodInfo.name] = async (...args) => {
      const { key, argumentsCount } = methodInfo;
      if (argumentsCount !== args.length) {
        throw new Error(`Arguments count mismatch, ${args.length} provided, ${argumentsCount} have been expected.`);
      }
      return await NativeProxy.callMethod(moduleName, key, args);
    };
  });

  // These are called by EventEmitter (which is a wrapper for NativeEventEmitter)
  // only on iOS and they use iOS-specific native module, EXReactNativeEventEmitter.
  //
  // On Android only {start,stop}Observing are called on the native module
  // and these should be exported as Expo methods.
  NativeModulesProxy[moduleName].addListener = (...args) =>
    NativeModules.EXReactNativeEventEmitter.addProxiedListener(moduleName, ...args);
  NativeModulesProxy[moduleName].removeListeners = (...args) =>
    NativeModules.EXReactNativeEventEmitter.removeProxiedListeners(moduleName, ...args);
});

module.exports = NativeModulesProxy;
