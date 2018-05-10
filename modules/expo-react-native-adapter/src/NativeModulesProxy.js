import { NativeModules } from 'react-native';

const NativeProxy = NativeModules.ExpoNativeModuleProxy;
const modulesConstantsKey = "modulesConstants";
const exportedMethodsKey = "exportedMethods";

const NativeModulesProxy = {};

Object.keys(NativeProxy[exportedMethodsKey]).forEach(moduleName => {
  NativeModulesProxy[moduleName] = NativeProxy[modulesConstantsKey][moduleName] || {};
  for (const methodName in NativeProxy[exportedMethodsKey][moduleName]) {
    NativeModulesProxy[moduleName][methodName] = async (...args) => {
      const { argumentsCount } = NativeProxy[exportedMethodsKey][moduleName][methodName];
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
