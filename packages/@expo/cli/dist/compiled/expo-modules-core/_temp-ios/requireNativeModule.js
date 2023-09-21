var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireNativeModule = requireNativeModule;
exports.requireOptionalNativeModule = requireOptionalNativeModule;
var _NativeModulesProxy = _interopRequireDefault(require("./NativeModulesProxy"));
function requireNativeModule(moduleName) {
  var nativeModule = requireOptionalNativeModule(moduleName);
  if (!nativeModule) {
    throw new Error(`Cannot find native module '${moduleName}'`);
  }
  return nativeModule;
}
function requireOptionalNativeModule(moduleName) {
  var _ref, _ref2, _globalThis$expo$modu, _globalThis$expo, _globalThis$expo$modu2, _globalThis$ExpoModul;
  return (_ref = (_ref2 = (_globalThis$expo$modu = (_globalThis$expo = globalThis.expo) == null ? void 0 : (_globalThis$expo$modu2 = _globalThis$expo.modules) == null ? void 0 : _globalThis$expo$modu2[moduleName]) != null ? _globalThis$expo$modu : (_globalThis$ExpoModul = globalThis.ExpoModules) == null ? void 0 : _globalThis$ExpoModul[moduleName]) != null ? _ref2 : _NativeModulesProxy.default[moduleName]) != null ? _ref : null;
}