import { NativeModules } from 'react-native';

const NativeProxy = NativeModules.ExpoNativeModuleProxy;

const NativeModulesProxy = {};

Object.keys(NativeProxy.exportedMethods).forEach(moduleName => {
  NativeModulesProxy[moduleName] = NativeProxy[moduleName] || {};
  for (const methodName in NativeProxy.exportedMethods[moduleName]) {
    NativeModulesProxy[moduleName][methodName] = async (...args) => {
      const { argumentsCount } = NativeProxy.exportedMethods[moduleName][methodName];
      if (argumentsCount !== args.length) {
        throw new Error(`Arguments count mismatch, ${args.length} provided, ${argumentsCount} have been expected.`);
      }
      return await NativeProxy.callMethod(moduleName, methodName, args);
    };
  }
  NativeModulesProxy[moduleName].addListener = (...args) =>
    NativeProxy.addProxiedListener(moduleName, ...args);
  NativeModulesProxy[moduleName].removeListeners = (...args) =>
    NativeProxy.removeProxiedListeners(moduleName, ...args);
});

module.exports = NativeModulesProxy;
