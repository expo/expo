import { NativeModules } from 'react-native';

const NativeProxy = NativeModules.ExpoNativeModuleProxy;

const NativeModulesProxy = {};

Object.keys(NativeProxy.exportedMethodsNames).forEach(moduleName => {
  NativeModulesProxy[moduleName] = NativeProxy[moduleName] || {};
  NativeProxy.exportedMethodsNames[moduleName].forEach(methodName => {
    NativeModulesProxy[moduleName][methodName] = (...args) =>
      NativeProxy.callMethod(moduleName, methodName, args);
    NativeModulesProxy[moduleName].addListener = (...args) =>
      NativeProxy.addProxiedListener(moduleName, ...args);
    NativeModulesProxy[moduleName].removeListeners = (...args) =>
      NativeProxy.removeProxiedListeners(moduleName, ...args);
  });
});

module.exports = NativeModulesProxy;
