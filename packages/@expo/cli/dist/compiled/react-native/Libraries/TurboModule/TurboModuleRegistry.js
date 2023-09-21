var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.getEnforcing = getEnforcing;
var _invariant = _interopRequireDefault(require("invariant"));
var NativeModules = require('../BatchedBridge/NativeModules');
var turboModuleProxy = global.__turboModuleProxy;
function requireModule(name) {
  if (global.RN$Bridgeless !== true) {
    var legacyModule = NativeModules[name];
    if (legacyModule != null) {
      return legacyModule;
    }
  }
  if (turboModuleProxy != null) {
    var module = turboModuleProxy(name);
    return module;
  }
  return null;
}
function get(name) {
  return requireModule(name);
}
function getEnforcing(name) {
  var module = requireModule(name);
  (0, _invariant.default)(module != null, `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. ` + 'Verify that a module by this name is registered in the native binary.');
  return module;
}