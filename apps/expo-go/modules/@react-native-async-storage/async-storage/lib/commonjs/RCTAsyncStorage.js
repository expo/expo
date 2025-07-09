"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactNative = require("react-native");
var _shouldFallbackToLegacyNativeModule = require("./shouldFallbackToLegacyNativeModule");
// TurboModuleRegistry falls back to NativeModules so we don't have to try go
// assign NativeModules' counterparts if TurboModuleRegistry would resolve
// with undefined.
let RCTAsyncStorage = _reactNative.TurboModuleRegistry ? _reactNative.TurboModuleRegistry.get("PlatformLocalStorage") ||
// Support for external modules, like react-native-windows
_reactNative.TurboModuleRegistry.get("RNC_AsyncSQLiteDBStorage") || _reactNative.TurboModuleRegistry.get("RNCAsyncStorage") : _reactNative.NativeModules["PlatformLocalStorage"] ||
// Support for external modules, like react-native-windows
_reactNative.NativeModules["RNC_AsyncSQLiteDBStorage"] || _reactNative.NativeModules["RNCAsyncStorage"];
if (!RCTAsyncStorage && (0, _shouldFallbackToLegacyNativeModule.shouldFallbackToLegacyNativeModule)()) {
  if (_reactNative.TurboModuleRegistry) {
    RCTAsyncStorage = _reactNative.TurboModuleRegistry.get("AsyncSQLiteDBStorage") || _reactNative.TurboModuleRegistry.get("AsyncLocalStorage");
  } else {
    RCTAsyncStorage = _reactNative.NativeModules["AsyncSQLiteDBStorage"] || _reactNative.NativeModules["AsyncLocalStorage"];
  }
}
var _default = exports.default = RCTAsyncStorage;
//# sourceMappingURL=RCTAsyncStorage.js.map