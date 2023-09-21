'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var BatchedBridge = require('./BatchedBridge');
var invariant = require('invariant');
function genModule(config, moduleID) {
  if (!config) {
    return null;
  }
  var _config = (0, _slicedToArray2.default)(config, 5),
    moduleName = _config[0],
    constants = _config[1],
    methods = _config[2],
    promiseMethods = _config[3],
    syncMethods = _config[4];
  invariant(!moduleName.startsWith('RCT') && !moduleName.startsWith('RK'), "Module name prefixes should've been stripped by the native side " + "but wasn't for " + moduleName);
  if (!constants && !methods) {
    return {
      name: moduleName
    };
  }
  var module = {};
  methods && methods.forEach(function (methodName, methodID) {
    var isPromise = promiseMethods && arrayContains(promiseMethods, methodID) || false;
    var isSync = syncMethods && arrayContains(syncMethods, methodID) || false;
    invariant(!isPromise || !isSync, 'Cannot have a method that is both async and a sync hook');
    var methodType = isPromise ? 'promise' : isSync ? 'sync' : 'async';
    module[methodName] = genMethod(moduleID, methodID, methodType);
  });
  Object.assign(module, constants);
  if (module.getConstants == null) {
    module.getConstants = function () {
      return constants || Object.freeze({});
    };
  } else {
    console.warn(`Unable to define method 'getConstants()' on NativeModule '${moduleName}'. NativeModule '${moduleName}' already has a constant or method called 'getConstants'. Please remove it.`);
  }
  if (__DEV__) {
    BatchedBridge.createDebugLookup(moduleID, moduleName, methods);
  }
  return {
    name: moduleName,
    module: module
  };
}
global.__fbGenNativeModule = genModule;
function loadModule(name, moduleID) {
  invariant(global.nativeRequireModuleConfig, "Can't lazily create module without nativeRequireModuleConfig");
  var config = global.nativeRequireModuleConfig(name);
  var info = genModule(config, moduleID);
  return info && info.module;
}
function genMethod(moduleID, methodID, type) {
  var fn = null;
  if (type === 'promise') {
    fn = function promiseMethodWrapper() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      var enqueueingFrameError = new Error();
      return new Promise(function (resolve, reject) {
        BatchedBridge.enqueueNativeCall(moduleID, methodID, args, function (data) {
          return resolve(data);
        }, function (errorData) {
          return reject(updateErrorWithErrorData(errorData, enqueueingFrameError));
        });
      });
    };
  } else {
    fn = function nonPromiseMethodWrapper() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      var lastArg = args.length > 0 ? args[args.length - 1] : null;
      var secondLastArg = args.length > 1 ? args[args.length - 2] : null;
      var hasSuccessCallback = typeof lastArg === 'function';
      var hasErrorCallback = typeof secondLastArg === 'function';
      hasErrorCallback && invariant(hasSuccessCallback, 'Cannot have a non-function arg after a function arg.');
      var onSuccess = hasSuccessCallback ? lastArg : null;
      var onFail = hasErrorCallback ? secondLastArg : null;
      var callbackCount = hasSuccessCallback + hasErrorCallback;
      var newArgs = args.slice(0, args.length - callbackCount);
      if (type === 'sync') {
        return BatchedBridge.callNativeSyncHook(moduleID, methodID, newArgs, onFail, onSuccess);
      } else {
        BatchedBridge.enqueueNativeCall(moduleID, methodID, newArgs, onFail, onSuccess);
      }
    };
  }
  fn.type = type;
  return fn;
}
function arrayContains(array, value) {
  return array.indexOf(value) !== -1;
}
function updateErrorWithErrorData(errorData, error) {
  return Object.assign(error, errorData || {});
}
var NativeModules = {};
if (global.nativeModuleProxy) {
  NativeModules = global.nativeModuleProxy;
} else if (!global.nativeExtensions) {
  var bridgeConfig = global.__fbBatchedBridgeConfig;
  invariant(bridgeConfig, '__fbBatchedBridgeConfig is not set, cannot invoke native modules');
  var defineLazyObjectProperty = require('../Utilities/defineLazyObjectProperty');
  (bridgeConfig.remoteModuleConfig || []).forEach(function (config, moduleID) {
    var info = genModule(config, moduleID);
    if (!info) {
      return;
    }
    if (info.module) {
      NativeModules[info.name] = info.module;
    } else {
      defineLazyObjectProperty(NativeModules, info.name, {
        get: function get() {
          return loadModule(info.name, moduleID);
        }
      });
    }
  });
}
module.exports = NativeModules;