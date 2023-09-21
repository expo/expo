/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.EventEmitter = void 0;
var _defineProperty2 = _interopRequireDefault(__nccwpck_require__(148));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(321));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(410));
var _invariant = _interopRequireDefault(__nccwpck_require__(251));
var _reactNative = __nccwpck_require__(853);
var nativeEmitterSubscriptionKey = '@@nativeEmitterSubscription@@';
var EventEmitter = function () {
  function EventEmitter(nativeModule) {
    (0, _classCallCheck2.default)(this, EventEmitter);
    this._listenerCount = 0;
    if (nativeModule.__expo_module_name__ && _reactNative.NativeModules.EXReactNativeEventEmitter) {
      nativeModule.addListener = function () {
        var _NativeModules$EXReac;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        return (_NativeModules$EXReac = _reactNative.NativeModules.EXReactNativeEventEmitter).addProxiedListener.apply(_NativeModules$EXReac, [nativeModule.__expo_module_name__].concat(args));
      };
      nativeModule.removeListeners = function () {
        var _NativeModules$EXReac2;
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        return (_NativeModules$EXReac2 = _reactNative.NativeModules.EXReactNativeEventEmitter).removeProxiedListeners.apply(_NativeModules$EXReac2, [nativeModule.__expo_module_name__].concat(args));
      };
    }
    this._nativeModule = nativeModule;
    this._eventEmitter = new _reactNative.NativeEventEmitter(nativeModule);
  }
  (0, _createClass2.default)(EventEmitter, [{
    key: "addListener",
    value: function addListener(eventName, listener) {
      var _this = this,
        _subscription;
      if (!this._listenerCount && _reactNative.Platform.OS !== 'ios' && this._nativeModule.startObserving) {
        this._nativeModule.startObserving();
      }
      this._listenerCount++;
      var nativeEmitterSubscription = this._eventEmitter.addListener(eventName, listener);
      var subscription = (_subscription = {}, (0, _defineProperty2.default)(_subscription, nativeEmitterSubscriptionKey, nativeEmitterSubscription), (0, _defineProperty2.default)(_subscription, "remove", function remove() {
        _this.removeSubscription(subscription);
      }), _subscription);
      return subscription;
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners(eventName) {
      var removedListenerCount = this._eventEmitter.listenerCount ? this._eventEmitter.listenerCount(eventName) : this._eventEmitter.listeners(eventName).length;
      this._eventEmitter.removeAllListeners(eventName);
      this._listenerCount -= removedListenerCount;
      (0, _invariant.default)(this._listenerCount >= 0, `EventEmitter must have a non-negative number of listeners`);
      if (!this._listenerCount && _reactNative.Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
        this._nativeModule.stopObserving();
      }
    }
  }, {
    key: "removeSubscription",
    value: function removeSubscription(subscription) {
      var nativeEmitterSubscription = subscription[nativeEmitterSubscriptionKey];
      if (!nativeEmitterSubscription) {
        return;
      }
      if ('remove' in nativeEmitterSubscription) {
        nativeEmitterSubscription.remove();
      } else if ('removeSubscription' in this._eventEmitter) {
        this._eventEmitter.removeSubscription(nativeEmitterSubscription);
      }
      this._listenerCount--;
      delete subscription[nativeEmitterSubscriptionKey];
      subscription.remove = function () {};
      if (!this._listenerCount && _reactNative.Platform.OS !== 'ios' && this._nativeModule.stopObserving) {
        this._nativeModule.stopObserving();
      }
    }
  }, {
    key: "emit",
    value: function emit(eventName) {
      var _this$_eventEmitter;
      for (var _len3 = arguments.length, params = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        params[_key3 - 1] = arguments[_key3];
      }
      (_this$_eventEmitter = this._eventEmitter).emit.apply(_this$_eventEmitter, [eventName].concat(params));
    }
  }]);
  return EventEmitter;
}();
exports.EventEmitter = EventEmitter;

/***/ }),

/***/ 559:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _reactNative = __nccwpck_require__(853);
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
exports["default"] = _default;

/***/ }),

/***/ 450:
/***/ (function() {



/***/ }),

/***/ 82:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.requireNativeViewManager = requireNativeViewManager;
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(321));
var _createClass2 = _interopRequireDefault(__nccwpck_require__(410));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(377));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(780));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(123));
var _react = _interopRequireDefault(__nccwpck_require__(522));
var _reactNative = __nccwpck_require__(853);
var _requireNativeModule = __nccwpck_require__(158);
var _jsxRuntime = __nccwpck_require__(872);
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var nativeComponentsCache = new Map();
function requireCachedNativeComponent(viewName) {
  var cachedNativeComponent = nativeComponentsCache.get(viewName);
  if (!cachedNativeComponent) {
    var nativeComponent = (0, _reactNative.requireNativeComponent)(viewName);
    nativeComponentsCache.set(viewName, nativeComponent);
    return nativeComponent;
  }
  return cachedNativeComponent;
}
function requireNativeViewManager(viewName) {
  var viewManagersMetadata = _reactNative.NativeModules.NativeUnimoduleProxy.viewManagersMetadata;
  var viewManagerConfig = viewManagersMetadata == null ? void 0 : viewManagersMetadata[viewName];
  if (__DEV__ && !viewManagerConfig) {
    var exportedViewManagerNames = Object.keys(viewManagersMetadata).join(', ');
    console.warn(`The native view manager required by name (${viewName}) from NativeViewManagerAdapter isn't exported by expo-modules-core. Views of this type may not render correctly. Exported view managers: [${exportedViewManagerNames}].`);
  }
  var reactNativeViewName = `ViewManagerAdapter_${viewName}`;
  var ReactNativeComponent = requireCachedNativeComponent(reactNativeViewName);
  var NativeComponent = function (_React$PureComponent) {
    (0, _inherits2.default)(NativeComponent, _React$PureComponent);
    var _super = _createSuper(NativeComponent);
    function NativeComponent() {
      var _this;
      (0, _classCallCheck2.default)(this, NativeComponent);
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _super.call.apply(_super, [this].concat(args));
      _this.nativeTag = null;
      return _this;
    }
    (0, _createClass2.default)(NativeComponent, [{
      key: "componentDidMount",
      value: function componentDidMount() {
        this.nativeTag = (0, _reactNative.findNodeHandle)(this);
      }
    }, {
      key: "render",
      value: function render() {
        return (0, _jsxRuntime.jsx)(ReactNativeComponent, Object.assign({}, this.props));
      }
    }]);
    return NativeComponent;
  }(_react.default.PureComponent);
  NativeComponent.displayName = viewName;
  try {
    var nativeModule = (0, _requireNativeModule.requireNativeModule)(viewName);
    var nativeViewPrototype = nativeModule.ViewPrototype;
    if (nativeViewPrototype) {
      Object.assign(NativeComponent.prototype, nativeViewPrototype);
    }
  } catch (_unused) {}
  return NativeComponent;
}

/***/ }),

/***/ 629:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createPermissionHook = createPermissionHook;
var _asyncToGenerator2 = _interopRequireDefault(__nccwpck_require__(727));
var _objectWithoutProperties2 = _interopRequireDefault(__nccwpck_require__(61));
var _slicedToArray2 = _interopRequireDefault(__nccwpck_require__(250));
var _react = __nccwpck_require__(522);
var _excluded = ["get", "request"];
function usePermission(methods, options) {
  var isMounted = (0, _react.useRef)(true);
  var _useState = (0, _react.useState)(null),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    status = _useState2[0],
    setStatus = _useState2[1];
  var _ref = options || {},
    _ref$get = _ref.get,
    get = _ref$get === void 0 ? true : _ref$get,
    _ref$request = _ref.request,
    request = _ref$request === void 0 ? false : _ref$request,
    permissionOptions = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var getPermission = (0, _react.useCallback)((0, _asyncToGenerator2.default)(function* () {
    var response = yield methods.getMethod(Object.keys(permissionOptions).length > 0 ? permissionOptions : undefined);
    if (isMounted.current) setStatus(response);
    return response;
  }), [methods.getMethod]);
  var requestPermission = (0, _react.useCallback)((0, _asyncToGenerator2.default)(function* () {
    var response = yield methods.requestMethod(Object.keys(permissionOptions).length > 0 ? permissionOptions : undefined);
    if (isMounted.current) setStatus(response);
    return response;
  }), [methods.requestMethod]);
  (0, _react.useEffect)(function runMethods() {
    if (request) requestPermission();
    if (!request && get) getPermission();
  }, [get, request, requestPermission, getPermission]);
  (0, _react.useEffect)(function didMount() {
    isMounted.current = true;
    return function () {
      isMounted.current = false;
    };
  }, []);
  return [status, requestPermission, getPermission];
}
function createPermissionHook(methods) {
  return function (options) {
    return usePermission(methods, options);
  };
}

/***/ }),

/***/ 714:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.PermissionStatus = void 0;
var PermissionStatus;
exports.PermissionStatus = PermissionStatus;
(function (PermissionStatus) {
  PermissionStatus["GRANTED"] = "granted";
  PermissionStatus["UNDETERMINED"] = "undetermined";
  PermissionStatus["DENIED"] = "denied";
})(PermissionStatus || (exports.PermissionStatus = PermissionStatus = {}));

/***/ }),

/***/ 621:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _reactNative = __nccwpck_require__(853);
var _browser = __nccwpck_require__(535);
var Platform = {
  OS: _reactNative.Platform.OS,
  select: _reactNative.Platform.select,
  isDOMAvailable: _browser.isDOMAvailable,
  canUseEventListeners: _browser.canUseEventListeners,
  canUseViewport: _browser.canUseViewport,
  isAsyncDebugging: _browser.isAsyncDebugging
};
var _default = Platform;
exports["default"] = _default;

/***/ }),

/***/ 315:
/***/ (function() {



/***/ }),

/***/ 535:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isDOMAvailable = exports.isAsyncDebugging = exports.canUseViewport = exports.canUseEventListeners = void 0;
var isDOMAvailable = false;
exports.isDOMAvailable = isDOMAvailable;
var canUseEventListeners = false;
exports.canUseEventListeners = canUseEventListeners;
var canUseViewport = false;
exports.canUseViewport = canUseViewport;
var isAsyncDebugging = false;
exports.isAsyncDebugging = isAsyncDebugging;
if (__DEV__) {
  exports.isAsyncDebugging = isAsyncDebugging = !global.nativeExtensions && !global.nativeCallSyncHook && !global.RN$Bridgeless;
}

/***/ }),

/***/ 155:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.CodedError = void 0;
var _createClass2 = _interopRequireDefault(__nccwpck_require__(410));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(321));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(377));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(780));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(123));
var _wrapNativeSuper2 = _interopRequireDefault(__nccwpck_require__(851));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var CodedError = function (_Error) {
  (0, _inherits2.default)(CodedError, _Error);
  var _super = _createSuper(CodedError);
  function CodedError(code, message) {
    var _this;
    (0, _classCallCheck2.default)(this, CodedError);
    _this = _super.call(this, message);
    _this.code = code;
    return _this;
  }
  return (0, _createClass2.default)(CodedError);
}((0, _wrapNativeSuper2.default)(Error));
exports.CodedError = CodedError;

/***/ }),

/***/ 74:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.UnavailabilityError = void 0;
var _createClass2 = _interopRequireDefault(__nccwpck_require__(410));
var _classCallCheck2 = _interopRequireDefault(__nccwpck_require__(321));
var _inherits2 = _interopRequireDefault(__nccwpck_require__(377));
var _possibleConstructorReturn2 = _interopRequireDefault(__nccwpck_require__(780));
var _getPrototypeOf2 = _interopRequireDefault(__nccwpck_require__(123));
var _CodedError2 = __nccwpck_require__(155);
var _Platform = _interopRequireDefault(__nccwpck_require__(621));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var UnavailabilityError = function (_CodedError) {
  (0, _inherits2.default)(UnavailabilityError, _CodedError);
  var _super = _createSuper(UnavailabilityError);
  function UnavailabilityError(moduleName, propertyName) {
    (0, _classCallCheck2.default)(this, UnavailabilityError);
    return _super.call(this, 'ERR_UNAVAILABLE', `The method or property ${moduleName}.${propertyName} is not available on ${_Platform.default.OS}, are you sure you've linked all the native dependencies properly?`);
  }
  return (0, _createClass2.default)(UnavailabilityError);
}(_CodedError2.CodedError);
exports.UnavailabilityError = UnavailabilityError;

/***/ }),

/***/ 705:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
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
Object.defineProperty(exports, "CodedError", ({
  enumerable: true,
  get: function get() {
    return _CodedError.CodedError;
  }
}));
Object.defineProperty(exports, "DeviceEventEmitter", ({
  enumerable: true,
  get: function get() {
    return _reactNative.DeviceEventEmitter;
  }
}));
Object.defineProperty(exports, "EventEmitter", ({
  enumerable: true,
  get: function get() {
    return _EventEmitter.EventEmitter;
  }
}));
Object.defineProperty(exports, "NativeModulesProxy", ({
  enumerable: true,
  get: function get() {
    return _NativeModulesProxy.default;
  }
}));
Object.defineProperty(exports, "Platform", ({
  enumerable: true,
  get: function get() {
    return _Platform.default;
  }
}));
Object.defineProperty(exports, "ProxyNativeModule", ({
  enumerable: true,
  get: function get() {
    return _NativeModulesProxy2.ProxyNativeModule;
  }
}));
Object.defineProperty(exports, "Subscription", ({
  enumerable: true,
  get: function get() {
    return _EventEmitter.Subscription;
  }
}));
exports.SyntheticPlatformEmitter = void 0;
Object.defineProperty(exports, "UnavailabilityError", ({
  enumerable: true,
  get: function get() {
    return _UnavailabilityError.UnavailabilityError;
  }
}));
Object.defineProperty(exports, "requireNativeViewManager", ({
  enumerable: true,
  get: function get() {
    return _NativeViewManagerAdapter.requireNativeViewManager;
  }
}));
Object.defineProperty(exports, "uuid", ({
  enumerable: true,
  get: function get() {
    return _uuid.default;
  }
}));
var _reactNative = __nccwpck_require__(853);
var _EventEmitter = __nccwpck_require__(351);
var _NativeModulesProxy = _interopRequireDefault(__nccwpck_require__(559));
var _NativeModulesProxy2 = __nccwpck_require__(450);
var _NativeViewManagerAdapter = __nccwpck_require__(82);
var _Platform = _interopRequireDefault(__nccwpck_require__(621));
var _CodedError = __nccwpck_require__(155);
var _UnavailabilityError = __nccwpck_require__(74);
__nccwpck_require__(696);
var _uuid = _interopRequireDefault(__nccwpck_require__(922));
var _requireNativeModule = __nccwpck_require__(158);
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
var _TypedArrays = __nccwpck_require__(315);
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
var _PermissionsInterface = __nccwpck_require__(714);
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
var _PermissionsHook = __nccwpck_require__(629);
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

/***/ }),

/***/ 158:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.requireNativeModule = requireNativeModule;
exports.requireOptionalNativeModule = requireOptionalNativeModule;
var _NativeModulesProxy = _interopRequireDefault(__nccwpck_require__(559));
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

/***/ }),

/***/ 996:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _NativeModulesProxy = _interopRequireDefault(__nccwpck_require__(559));
var _default = _NativeModulesProxy.default.ExpoModulesCoreErrorManager;
exports["default"] = _default;

/***/ }),

/***/ 696:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
var _NativeErrorManager = _interopRequireDefault(__nccwpck_require__(996));
var _EventEmitter = __nccwpck_require__(351);
var _Platform = _interopRequireDefault(__nccwpck_require__(621));
var _CodedError = __nccwpck_require__(155);
if (__DEV__ && _Platform.default.OS === 'android' && _NativeErrorManager.default) {
  var onNewException = 'ExpoModulesCoreErrorManager.onNewException';
  var onNewWarning = 'ExpoModulesCoreErrorManager.onNewWarning';
  var eventEmitter = new _EventEmitter.EventEmitter(_NativeErrorManager.default);
  eventEmitter.addListener(onNewException, function (_ref) {
    var message = _ref.message;
    console.error(message);
  });
  eventEmitter.addListener(onNewWarning, function (_ref2) {
    var message = _ref2.message;
    console.warn(message);
  });
}
globalThis.ExpoModulesCore_CodedError = _CodedError.CodedError;

/***/ }),

/***/ 922:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
Object.defineProperty(exports, "default", ({
  enumerable: true,
  get: function get() {
    return _uuid.default;
  }
}));
var _uuid = _interopRequireDefault(__nccwpck_require__(915));

/***/ }),

/***/ 222:
/***/ (function(__unused_webpack_module, exports) {

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}
function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return [bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]]].join('');
}
var _default = bytesToUuid;
exports["default"] = _default;

/***/ }),

/***/ 581:
/***/ (function(__unused_webpack_module, exports) {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;
    case 1:
      return x ^ y ^ z;
    case 2:
      return x & y ^ x & z ^ y & z;
    case 3:
      return x ^ y ^ z;
    default:
      return 0;
  }
}
function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}
function sha1(bytes) {
  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  if (typeof bytes == 'string') {
    var msg = unescape(encodeURIComponent(bytes));
    bytes = new Array(msg.length);
    for (var i = 0; i < msg.length; i++) bytes[i] = msg.charCodeAt(i);
  }
  bytes.push(0x80);
  var l = bytes.length / 4 + 2;
  var N = Math.ceil(l / 16);
  var M = new Array(N);
  for (var _i = 0; _i < N; _i++) {
    M[_i] = new Array(16);
    for (var j = 0; j < 16; j++) {
      M[_i][j] = bytes[_i * 64 + j * 4] << 24 | bytes[_i * 64 + j * 4 + 1] << 16 | bytes[_i * 64 + j * 4 + 2] << 8 | bytes[_i * 64 + j * 4 + 3];
    }
  }
  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;
  for (var _i2 = 0; _i2 < N; _i2++) {
    var W = new Array(80);
    for (var t = 0; t < 16; t++) W[t] = M[_i2][t];
    for (var _t = 16; _t < 80; _t++) {
      W[_t] = ROTL(W[_t - 3] ^ W[_t - 8] ^ W[_t - 14] ^ W[_t - 16], 1);
    }
    var a = H[0];
    var b = H[1];
    var c = H[2];
    var d = H[3];
    var e = H[4];
    for (var _t2 = 0; _t2 < 80; _t2++) {
      var s = Math.floor(_t2 / 20);
      var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[_t2] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }
    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }
  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}
var _default = sha1;
exports["default"] = _default;

/***/ }),

/***/ 317:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = _default;
var _bytesToUuid = _interopRequireDefault(__nccwpck_require__(222));
function uuidToBytes(uuid) {
  var bytes = [];
  uuid.replace(/[a-fA-F0-9]{2}/g, function (hex) {
    bytes.push(parseInt(hex, 16));
    return '';
  });
  return bytes;
}
function stringToBytes(str) {
  str = unescape(encodeURIComponent(str));
  var bytes = new Array(str.length);
  for (var i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}
function _default(name, version, hashfunc) {
  var generateUUID = function generateUUID(value, namespace, buf, offset) {
    var off = buf && offset || 0;
    if (typeof value == 'string') value = stringToBytes(value);
    if (typeof namespace == 'string') namespace = uuidToBytes(namespace);
    if (!Array.isArray(value)) throw TypeError('value must be an array of bytes');
    if (!Array.isArray(namespace) || namespace.length !== 16) throw TypeError('namespace must be uuid string or an Array of 16 byte values');
    var bytes = hashfunc(namespace.concat(value));
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;
    if (buf) {
      for (var idx = 0; idx < 16; ++idx) {
        buf[off + idx] = bytes[idx];
      }
    }
    return (0, _bytesToUuid.default)(bytes);
  };
  try {
    generateUUID.name = name;
  } catch (_unused) {}
  generateUUID.DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  generateUUID.URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
  return generateUUID;
}

/***/ }),

/***/ 915:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

var _interopRequireDefault = __nccwpck_require__(973);
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _sha = _interopRequireDefault(__nccwpck_require__(581));
var _v = _interopRequireDefault(__nccwpck_require__(317));
var _globalThis$expo;
var nativeUuidv4 = globalThis == null ? void 0 : (_globalThis$expo = globalThis.expo) == null ? void 0 : _globalThis$expo.uuidv4;
function uuidv4() {
  if (!nativeUuidv4) {
    throw Error("Native UUID version 4 generator implementation wasn't found in `expo-modules-core`");
  }
  return nativeUuidv4();
}
var uuid = {
  v4: uuidv4,
  v5: (0, _v.default)('v5', 0x50, _sha.default)
};
var _default = uuid;
exports["default"] = _default;

/***/ }),

/***/ 727:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/asyncToGenerator");

/***/ }),

/***/ 321:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/classCallCheck");

/***/ }),

/***/ 410:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/createClass");

/***/ }),

/***/ 148:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/defineProperty");

/***/ }),

/***/ 123:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/getPrototypeOf");

/***/ }),

/***/ 377:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/inherits");

/***/ }),

/***/ 973:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/interopRequireDefault");

/***/ }),

/***/ 61:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/objectWithoutProperties");

/***/ }),

/***/ 780:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/possibleConstructorReturn");

/***/ }),

/***/ 250:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/slicedToArray");

/***/ }),

/***/ 851:
/***/ (function(module) {

"use strict";
module.exports = require("@babel/runtime/helpers/wrapNativeSuper");

/***/ }),

/***/ 853:
/***/ (function(module) {

"use strict";
module.exports = require("@expo/cli/dist/compiled/react-native");

/***/ }),

/***/ 251:
/***/ (function(module) {

"use strict";
module.exports = require("invariant");

/***/ }),

/***/ 522:
/***/ (function(module) {

"use strict";
module.exports = require("react");

/***/ }),

/***/ 872:
/***/ (function(module) {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = "" + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(705);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;