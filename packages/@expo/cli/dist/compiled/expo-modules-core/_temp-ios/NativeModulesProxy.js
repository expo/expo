Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _global$expo, _global$expo$modules;
var LegacyNativeProxy = _reactNative.NativeModules.NativeUnimoduleProxy;
var ExpoNativeProxy = (_global$expo = global.expo) == null ? void 0 : (_global$expo$modules = _global$expo.modules) == null ? void 0 : _global$expo$modules.NativeModulesProxy;
var modulesConstantsKey = 'modulesConstants';
var exportedMethodsKey = 'exportedMethods';
var NativeModulesProxy = {};
if (LegacyNativeProxy) {
  var NativeProxy = ExpoNativeProxy != null ? ExpoNativeProxy : LegacyNativeProxy;
  Object.keys(NativeProxy[exportedMethodsKey]).forEach(function (moduleName) {
    NativeModulesProxy[moduleName] = NativeProxy[modulesConstantsKey][moduleName] || {};
    NativeProxy[exportedMethodsKey][moduleName].forEach(function (methodInfo) {
      NativeModulesProxy[moduleName][methodInfo.name] = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (ExpoNativeProxy != null && ExpoNativeProxy.callMethod) {
          return ExpoNativeProxy.callMethod(moduleName, methodInfo.name, args);
        }
        var key = methodInfo.key,
          argumentsCount = methodInfo.argumentsCount;
        if (argumentsCount !== args.length) {
          return Promise.reject(new Error(`Native method ${moduleName}.${methodInfo.name} expects ${argumentsCount} ${argumentsCount === 1 ? 'argument' : 'arguments'} but received ${args.length}`));
        }
        return LegacyNativeProxy.callMethod(moduleName, key, args);
      };
    });
    if (_reactNative.NativeModules.EXReactNativeEventEmitter) {
      NativeModulesProxy[moduleName].addListener = function () {
        var _NativeModules$EXReac;
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        return (_NativeModules$EXReac = _reactNative.NativeModules.EXReactNativeEventEmitter).addProxiedListener.apply(_NativeModules$EXReac, [moduleName].concat(args));
      };
      NativeModulesProxy[moduleName].removeListeners = function () {
        var _NativeModules$EXReac2;
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }
        return (_NativeModules$EXReac2 = _reactNative.NativeModules.EXReactNativeEventEmitter).removeProxiedListeners.apply(_NativeModules$EXReac2, [moduleName].concat(args));
      };
    } else {
      NativeModulesProxy[moduleName].addListener = function () {};
      NativeModulesProxy[moduleName].removeListeners = function () {};
    }
  });
} else {
  console.warn(`The "EXNativeModulesProxy" native module is not exported through NativeModules; verify that expo-modules-core's native code is linked properly`);
}
var _default = NativeModulesProxy;
exports.default = _default;