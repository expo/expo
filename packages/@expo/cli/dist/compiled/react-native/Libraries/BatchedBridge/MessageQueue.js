'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var Systrace = require('../Performance/Systrace');
var deepFreezeAndThrowOnMutationInDev = require('../Utilities/deepFreezeAndThrowOnMutationInDev');
var stringifySafe = require('../Utilities/stringifySafe').default;
var warnOnce = require('../Utilities/warnOnce');
var ErrorUtils = require('../vendor/core/ErrorUtils');
var invariant = require('invariant');
var TO_JS = 0;
var TO_NATIVE = 1;
var MODULE_IDS = 0;
var METHOD_IDS = 1;
var PARAMS = 2;
var MIN_TIME_BETWEEN_FLUSHES_MS = 5;
var TRACE_TAG_REACT_APPS = 1 << 17;
var DEBUG_INFO_LIMIT = 32;
var MessageQueue = function () {
  function MessageQueue() {
    (0, _classCallCheck2.default)(this, MessageQueue);
    this._lazyCallableModules = {};
    this._queue = [[], [], [], 0];
    this._successCallbacks = new Map();
    this._failureCallbacks = new Map();
    this._callID = 0;
    this._lastFlush = 0;
    this._eventLoopStartTime = Date.now();
    this._reactNativeMicrotasksCallback = null;
    if (__DEV__) {
      this._debugInfo = {};
      this._remoteModuleTable = {};
      this._remoteMethodTable = {};
    }
    this.callFunctionReturnFlushedQueue = this.callFunctionReturnFlushedQueue.bind(this);
    this.flushedQueue = this.flushedQueue.bind(this);
    this.invokeCallbackAndReturnFlushedQueue = this.invokeCallbackAndReturnFlushedQueue.bind(this);
  }
  (0, _createClass2.default)(MessageQueue, [{
    key: "callFunctionReturnFlushedQueue",
    value: function callFunctionReturnFlushedQueue(module, method, args) {
      var _this = this;
      this.__guard(function () {
        _this.__callFunction(module, method, args);
      });
      return this.flushedQueue();
    }
  }, {
    key: "invokeCallbackAndReturnFlushedQueue",
    value: function invokeCallbackAndReturnFlushedQueue(cbID, args) {
      var _this2 = this;
      this.__guard(function () {
        _this2.__invokeCallback(cbID, args);
      });
      return this.flushedQueue();
    }
  }, {
    key: "flushedQueue",
    value: function flushedQueue() {
      var _this3 = this;
      this.__guard(function () {
        _this3.__callReactNativeMicrotasks();
      });
      var queue = this._queue;
      this._queue = [[], [], [], this._callID];
      return queue[0].length ? queue : null;
    }
  }, {
    key: "getEventLoopRunningTime",
    value: function getEventLoopRunningTime() {
      return Date.now() - this._eventLoopStartTime;
    }
  }, {
    key: "registerCallableModule",
    value: function registerCallableModule(name, module) {
      this._lazyCallableModules[name] = function () {
        return module;
      };
    }
  }, {
    key: "registerLazyCallableModule",
    value: function registerLazyCallableModule(name, factory) {
      var module;
      var getValue = factory;
      this._lazyCallableModules[name] = function () {
        if (getValue) {
          module = getValue();
          getValue = null;
        }
        return module;
      };
    }
  }, {
    key: "getCallableModule",
    value: function getCallableModule(name) {
      var getValue = this._lazyCallableModules[name];
      return getValue ? getValue() : null;
    }
  }, {
    key: "callNativeSyncHook",
    value: function callNativeSyncHook(moduleID, methodID, params, onFail, onSucc) {
      if (__DEV__) {
        invariant(global.nativeCallSyncHook, 'Calling synchronous methods on native ' + 'modules is not supported in Chrome.\n\n Consider providing alternative ' + 'methods to expose this method in debug mode, e.g. by exposing constants ' + 'ahead-of-time.');
      }
      this.processCallbacks(moduleID, methodID, params, onFail, onSucc);
      return global.nativeCallSyncHook(moduleID, methodID, params);
    }
  }, {
    key: "processCallbacks",
    value: function processCallbacks(moduleID, methodID, params, onFail, onSucc) {
      var _this4 = this;
      if (onFail || onSucc) {
        if (__DEV__) {
          this._debugInfo[this._callID] = [moduleID, methodID];
          if (this._callID > DEBUG_INFO_LIMIT) {
            delete this._debugInfo[this._callID - DEBUG_INFO_LIMIT];
          }
          if (this._successCallbacks.size > 500) {
            var info = {};
            this._successCallbacks.forEach(function (_, callID) {
              var debug = _this4._debugInfo[callID];
              var module = debug && _this4._remoteModuleTable[debug[0]];
              var method = debug && _this4._remoteMethodTable[debug[0]][debug[1]];
              info[callID] = {
                module: module,
                method: method
              };
            });
            warnOnce('excessive-number-of-pending-callbacks', `Excessive number of pending callbacks: ${this._successCallbacks.size}. Some pending callbacks that might have leaked by never being called from native code: ${stringifySafe(info)}`);
          }
        }
        onFail && params.push(this._callID << 1);
        onSucc && params.push(this._callID << 1 | 1);
        this._successCallbacks.set(this._callID, onSucc);
        this._failureCallbacks.set(this._callID, onFail);
      }
      if (__DEV__) {
        global.nativeTraceBeginAsyncFlow && global.nativeTraceBeginAsyncFlow(TRACE_TAG_REACT_APPS, 'native', this._callID);
      }
      this._callID++;
    }
  }, {
    key: "enqueueNativeCall",
    value: function enqueueNativeCall(moduleID, methodID, params, onFail, onSucc) {
      this.processCallbacks(moduleID, methodID, params, onFail, onSucc);
      this._queue[MODULE_IDS].push(moduleID);
      this._queue[METHOD_IDS].push(methodID);
      if (__DEV__) {
        var isValidArgument = function isValidArgument(val) {
          switch (typeof val) {
            case 'undefined':
            case 'boolean':
            case 'string':
              return true;
            case 'number':
              return isFinite(val);
            case 'object':
              if (val == null) {
                return true;
              }
              if (Array.isArray(val)) {
                return val.every(isValidArgument);
              }
              for (var k in val) {
                if (typeof val[k] !== 'function' && !isValidArgument(val[k])) {
                  return false;
                }
              }
              return true;
            case 'function':
              return false;
            default:
              return false;
          }
        };
        var replacer = function replacer(key, val) {
          var t = typeof val;
          if (t === 'function') {
            return '<<Function ' + val.name + '>>';
          } else if (t === 'number' && !isFinite(val)) {
            return '<<' + val.toString() + '>>';
          } else {
            return val;
          }
        };
        invariant(isValidArgument(params), '%s is not usable as a native method argument', JSON.stringify(params, replacer));
        deepFreezeAndThrowOnMutationInDev(params);
      }
      this._queue[PARAMS].push(params);
      var now = Date.now();
      if (global.nativeFlushQueueImmediate && now - this._lastFlush >= MIN_TIME_BETWEEN_FLUSHES_MS) {
        var queue = this._queue;
        this._queue = [[], [], [], this._callID];
        this._lastFlush = now;
        global.nativeFlushQueueImmediate(queue);
      }
      Systrace.counterEvent('pending_js_to_native_queue', this._queue[0].length);
      if (__DEV__ && this.__spy && isFinite(moduleID)) {
        this.__spy({
          type: TO_NATIVE,
          module: this._remoteModuleTable[moduleID],
          method: this._remoteMethodTable[moduleID][methodID],
          args: params
        });
      } else if (this.__spy) {
        this.__spy({
          type: TO_NATIVE,
          module: moduleID + '',
          method: methodID,
          args: params
        });
      }
    }
  }, {
    key: "createDebugLookup",
    value: function createDebugLookup(moduleID, name, methods) {
      if (__DEV__) {
        this._remoteModuleTable[moduleID] = name;
        this._remoteMethodTable[moduleID] = methods || [];
      }
    }
  }, {
    key: "setReactNativeMicrotasksCallback",
    value: function setReactNativeMicrotasksCallback(fn) {
      this._reactNativeMicrotasksCallback = fn;
    }
  }, {
    key: "__guard",
    value: function __guard(fn) {
      if (this.__shouldPauseOnThrow()) {
        fn();
      } else {
        try {
          fn();
        } catch (error) {
          ErrorUtils.reportFatalError(error);
        }
      }
    }
  }, {
    key: "__shouldPauseOnThrow",
    value: function __shouldPauseOnThrow() {
      return typeof DebuggerInternal !== 'undefined' && DebuggerInternal.shouldPauseOnThrow === true;
    }
  }, {
    key: "__callReactNativeMicrotasks",
    value: function __callReactNativeMicrotasks() {
      Systrace.beginEvent('JSTimers.callReactNativeMicrotasks()');
      if (this._reactNativeMicrotasksCallback != null) {
        this._reactNativeMicrotasksCallback();
      }
      Systrace.endEvent();
    }
  }, {
    key: "__callFunction",
    value: function __callFunction(module, method, args) {
      this._lastFlush = Date.now();
      this._eventLoopStartTime = this._lastFlush;
      if (__DEV__ || this.__spy) {
        Systrace.beginEvent(`${module}.${method}(${stringifySafe(args)})`);
      } else {
        Systrace.beginEvent(`${module}.${method}(...)`);
      }
      if (this.__spy) {
        this.__spy({
          type: TO_JS,
          module: module,
          method: method,
          args: args
        });
      }
      var moduleMethods = this.getCallableModule(module);
      if (!moduleMethods) {
        var callableModuleNames = Object.keys(this._lazyCallableModules);
        var n = callableModuleNames.length;
        var callableModuleNameList = callableModuleNames.join(', ');
        var isBridgelessMode = global.RN$Bridgeless === true ? 'true' : 'false';
        invariant(false, `Failed to call into JavaScript module method ${module}.${method}(). Module has not been registered as callable. Bridgeless Mode: ${isBridgelessMode}. Registered callable JavaScript modules (n = ${n}): ${callableModuleNameList}.
        A frequent cause of the error is that the application entry file path is incorrect. This can also happen when the JS bundle is corrupt or there is an early initialization error when loading React Native.`);
      }
      if (!moduleMethods[method]) {
        invariant(false, `Failed to call into JavaScript module method ${module}.${method}(). Module exists, but the method is undefined.`);
      }
      moduleMethods[method].apply(moduleMethods, args);
      Systrace.endEvent();
    }
  }, {
    key: "__invokeCallback",
    value: function __invokeCallback(cbID, args) {
      this._lastFlush = Date.now();
      this._eventLoopStartTime = this._lastFlush;
      var callID = cbID >>> 1;
      var isSuccess = cbID & 1;
      var callback = isSuccess ? this._successCallbacks.get(callID) : this._failureCallbacks.get(callID);
      if (__DEV__) {
        var debug = this._debugInfo[callID];
        var _module = debug && this._remoteModuleTable[debug[0]];
        var method = debug && this._remoteMethodTable[debug[0]][debug[1]];
        invariant(callback, `No callback found with cbID ${cbID} and callID ${callID} for ` + (method ? ` ${_module}.${method} - most likely the callback was already invoked` : `module ${_module || '<unknown>'}`) + `. Args: '${stringifySafe(args)}'`);
        var profileName = debug ? '<callback for ' + _module + '.' + method + '>' : cbID;
        if (callback && this.__spy) {
          this.__spy({
            type: TO_JS,
            module: null,
            method: profileName,
            args: args
          });
        }
        Systrace.beginEvent(`MessageQueue.invokeCallback(${profileName}, ${stringifySafe(args)})`);
      }
      if (!callback) {
        return;
      }
      this._successCallbacks.delete(callID);
      this._failureCallbacks.delete(callID);
      callback.apply(void 0, (0, _toConsumableArray2.default)(args));
      if (__DEV__) {
        Systrace.endEvent();
      }
    }
  }], [{
    key: "spy",
    value: function spy(spyOrToggle) {
      if (spyOrToggle === true) {
        MessageQueue.prototype.__spy = function (info) {
          console.log(`${info.type === TO_JS ? 'N->JS' : 'JS->N'} : ` + `${info.module != null ? info.module + '.' : ''}${info.method}` + `(${JSON.stringify(info.args)})`);
        };
      } else if (spyOrToggle === false) {
        MessageQueue.prototype.__spy = null;
      } else {
        MessageQueue.prototype.__spy = spyOrToggle;
      }
    }
  }]);
  return MessageQueue;
}();
module.exports = MessageQueue;
//# sourceMappingURL=MessageQueue.js.map