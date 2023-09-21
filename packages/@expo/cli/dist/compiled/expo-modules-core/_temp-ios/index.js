var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  SyntheticPlatformEmitter: true,
  DeviceEventEmitter: true,
  EventEmitter: true,
  Subscription: true,
  NativeModulesProxy: true,
  ProxyNativeModule: true,
  requireNativeViewManager: true,
  Platform: true,
  CodedError: true,
  UnavailabilityError: true,
  uuid: true
};
Object.defineProperty(exports, "CodedError", {
  enumerable: true,
  get: function get() {
    return _CodedError.CodedError;
  }
});
Object.defineProperty(exports, "DeviceEventEmitter", {
  enumerable: true,
  get: function get() {
    return _reactNative.DeviceEventEmitter;
  }
});
Object.defineProperty(exports, "EventEmitter", {
  enumerable: true,
  get: function get() {
    return _EventEmitter.EventEmitter;
  }
});
Object.defineProperty(exports, "NativeModulesProxy", {
  enumerable: true,
  get: function get() {
    return _NativeModulesProxy.default;
  }
});
Object.defineProperty(exports, "Platform", {
  enumerable: true,
  get: function get() {
    return _Platform.default;
  }
});
Object.defineProperty(exports, "ProxyNativeModule", {
  enumerable: true,
  get: function get() {
    return _NativeModulesProxy2.ProxyNativeModule;
  }
});
Object.defineProperty(exports, "Subscription", {
  enumerable: true,
  get: function get() {
    return _EventEmitter.Subscription;
  }
});
exports.SyntheticPlatformEmitter = void 0;
Object.defineProperty(exports, "UnavailabilityError", {
  enumerable: true,
  get: function get() {
    return _UnavailabilityError.UnavailabilityError;
  }
});
Object.defineProperty(exports, "requireNativeViewManager", {
  enumerable: true,
  get: function get() {
    return _NativeViewManagerAdapter.requireNativeViewManager;
  }
});
Object.defineProperty(exports, "uuid", {
  enumerable: true,
  get: function get() {
    return _uuid.default;
  }
});
var _reactNative = require("react-native");
var _EventEmitter = require("./EventEmitter");
var _NativeModulesProxy = _interopRequireDefault(require("./NativeModulesProxy"));
var _NativeModulesProxy2 = require("./NativeModulesProxy.types");
var _NativeViewManagerAdapter = require("./NativeViewManagerAdapter");
var _Platform = _interopRequireDefault(require("./Platform"));
var _CodedError = require("./errors/CodedError");
var _UnavailabilityError = require("./errors/UnavailabilityError");
require("./sweet/setUpErrorManager.fx");
var _uuid = _interopRequireDefault(require("./uuid"));
var _requireNativeModule = require("./requireNativeModule");
Object.keys(_requireNativeModule).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _requireNativeModule[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _requireNativeModule[key];
    }
  });
});
var _TypedArrays = require("./TypedArrays.types");
Object.keys(_TypedArrays).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _TypedArrays[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _TypedArrays[key];
    }
  });
});
var _PermissionsInterface = require("./PermissionsInterface");
Object.keys(_PermissionsInterface).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _PermissionsInterface[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _PermissionsInterface[key];
    }
  });
});
var _PermissionsHook = require("./PermissionsHook");
Object.keys(_PermissionsHook).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _PermissionsHook[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _PermissionsHook[key];
    }
  });
});
var SyntheticPlatformEmitter = _reactNative.DeviceEventEmitter;
exports.SyntheticPlatformEmitter = SyntheticPlatformEmitter;