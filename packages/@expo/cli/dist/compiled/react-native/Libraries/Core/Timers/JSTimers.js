var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeTiming = _interopRequireDefault(require("./NativeTiming"));
var BatchedBridge = require('../../BatchedBridge/BatchedBridge');
var Systrace = require('../../Performance/Systrace');
var invariant = require('invariant');
var FRAME_DURATION = 1000 / 60;
var IDLE_CALLBACK_FRAME_DEADLINE = 1;
var callbacks = [];
var types = [];
var timerIDs = [];
var reactNativeMicrotasks = [];
var requestIdleCallbacks = [];
var requestIdleCallbackTimeouts = {};
var GUID = 1;
var errors = [];
var hasEmittedTimeDriftWarning = false;
function _getFreeIndex() {
  var freeIndex = timerIDs.indexOf(null);
  if (freeIndex === -1) {
    freeIndex = timerIDs.length;
  }
  return freeIndex;
}
function _allocateCallback(func, type) {
  var id = GUID++;
  var freeIndex = _getFreeIndex();
  timerIDs[freeIndex] = id;
  callbacks[freeIndex] = func;
  types[freeIndex] = type;
  return id;
}
function _callTimer(timerID, frameTime, didTimeout) {
  if (timerID > GUID) {
    console.warn('Tried to call timer with ID %s but no such timer exists.', timerID);
  }
  var timerIndex = timerIDs.indexOf(timerID);
  if (timerIndex === -1) {
    return;
  }
  var type = types[timerIndex];
  var callback = callbacks[timerIndex];
  if (!callback || !type) {
    console.error('No callback found for timerID ' + timerID);
    return;
  }
  if (__DEV__) {
    Systrace.beginEvent(type + ' [invoke]');
  }
  if (type !== 'setInterval') {
    _clearIndex(timerIndex);
  }
  try {
    if (type === 'setTimeout' || type === 'setInterval' || type === 'queueReactNativeMicrotask') {
      callback();
    } else if (type === 'requestAnimationFrame') {
      callback(global.performance.now());
    } else if (type === 'requestIdleCallback') {
      callback({
        timeRemaining: function timeRemaining() {
          return Math.max(0, FRAME_DURATION - (global.performance.now() - frameTime));
        },
        didTimeout: !!didTimeout
      });
    } else {
      console.error('Tried to call a callback with invalid type: ' + type);
    }
  } catch (e) {
    errors.push(e);
  }
  if (__DEV__) {
    Systrace.endEvent();
  }
}
function _callReactNativeMicrotasksPass() {
  if (reactNativeMicrotasks.length === 0) {
    return false;
  }
  if (__DEV__) {
    Systrace.beginEvent('callReactNativeMicrotasksPass()');
  }
  var passReactNativeMicrotasks = reactNativeMicrotasks;
  reactNativeMicrotasks = [];
  for (var i = 0; i < passReactNativeMicrotasks.length; ++i) {
    _callTimer(passReactNativeMicrotasks[i], 0);
  }
  if (__DEV__) {
    Systrace.endEvent();
  }
  return reactNativeMicrotasks.length > 0;
}
function _clearIndex(i) {
  timerIDs[i] = null;
  callbacks[i] = null;
  types[i] = null;
}
function _freeCallback(timerID) {
  if (timerID == null) {
    return;
  }
  var index = timerIDs.indexOf(timerID);
  if (index !== -1) {
    var type = types[index];
    _clearIndex(index);
    if (type !== 'queueReactNativeMicrotask' && type !== 'requestIdleCallback') {
      deleteTimer(timerID);
    }
  }
}
var JSTimers = {
  setTimeout: function setTimeout(func, duration) {
    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }
    var id = _allocateCallback(function () {
      return func.apply(undefined, args);
    }, 'setTimeout');
    createTimer(id, duration || 0, Date.now(), false);
    return id;
  },
  setInterval: function setInterval(func, duration) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      args[_key2 - 2] = arguments[_key2];
    }
    var id = _allocateCallback(function () {
      return func.apply(undefined, args);
    }, 'setInterval');
    createTimer(id, duration || 0, Date.now(), true);
    return id;
  },
  queueReactNativeMicrotask: function queueReactNativeMicrotask(func) {
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    var id = _allocateCallback(function () {
      return func.apply(undefined, args);
    }, 'queueReactNativeMicrotask');
    reactNativeMicrotasks.push(id);
    return id;
  },
  requestAnimationFrame: function requestAnimationFrame(func) {
    var id = _allocateCallback(func, 'requestAnimationFrame');
    createTimer(id, 1, Date.now(), false);
    return id;
  },
  requestIdleCallback: function requestIdleCallback(func, options) {
    if (requestIdleCallbacks.length === 0) {
      setSendIdleEvents(true);
    }
    var timeout = options && options.timeout;
    var id = _allocateCallback(timeout != null ? function (deadline) {
      var timeoutId = requestIdleCallbackTimeouts[id];
      if (timeoutId) {
        JSTimers.clearTimeout(timeoutId);
        delete requestIdleCallbackTimeouts[id];
      }
      return func(deadline);
    } : func, 'requestIdleCallback');
    requestIdleCallbacks.push(id);
    if (timeout != null) {
      var timeoutId = JSTimers.setTimeout(function () {
        var index = requestIdleCallbacks.indexOf(id);
        if (index > -1) {
          requestIdleCallbacks.splice(index, 1);
          _callTimer(id, global.performance.now(), true);
        }
        delete requestIdleCallbackTimeouts[id];
        if (requestIdleCallbacks.length === 0) {
          setSendIdleEvents(false);
        }
      }, timeout);
      requestIdleCallbackTimeouts[id] = timeoutId;
    }
    return id;
  },
  cancelIdleCallback: function cancelIdleCallback(timerID) {
    _freeCallback(timerID);
    var index = requestIdleCallbacks.indexOf(timerID);
    if (index !== -1) {
      requestIdleCallbacks.splice(index, 1);
    }
    var timeoutId = requestIdleCallbackTimeouts[timerID];
    if (timeoutId) {
      JSTimers.clearTimeout(timeoutId);
      delete requestIdleCallbackTimeouts[timerID];
    }
    if (requestIdleCallbacks.length === 0) {
      setSendIdleEvents(false);
    }
  },
  clearTimeout: function clearTimeout(timerID) {
    _freeCallback(timerID);
  },
  clearInterval: function clearInterval(timerID) {
    _freeCallback(timerID);
  },
  clearReactNativeMicrotask: function clearReactNativeMicrotask(timerID) {
    _freeCallback(timerID);
    var index = reactNativeMicrotasks.indexOf(timerID);
    if (index !== -1) {
      reactNativeMicrotasks.splice(index, 1);
    }
  },
  cancelAnimationFrame: function cancelAnimationFrame(timerID) {
    _freeCallback(timerID);
  },
  callTimers: function callTimers(timersToCall) {
    invariant(timersToCall.length !== 0, 'Cannot call `callTimers` with an empty list of IDs.');
    errors.length = 0;
    for (var i = 0; i < timersToCall.length; i++) {
      _callTimer(timersToCall[i], 0);
    }
    var errorCount = errors.length;
    if (errorCount > 0) {
      if (errorCount > 1) {
        for (var ii = 1; ii < errorCount; ii++) {
          JSTimers.setTimeout(function (error) {
            throw error;
          }.bind(null, errors[ii]), 0);
        }
      }
      throw errors[0];
    }
  },
  callIdleCallbacks: function callIdleCallbacks(frameTime) {
    if (FRAME_DURATION - (Date.now() - frameTime) < IDLE_CALLBACK_FRAME_DEADLINE) {
      return;
    }
    errors.length = 0;
    if (requestIdleCallbacks.length > 0) {
      var passIdleCallbacks = requestIdleCallbacks;
      requestIdleCallbacks = [];
      for (var i = 0; i < passIdleCallbacks.length; ++i) {
        _callTimer(passIdleCallbacks[i], frameTime);
      }
    }
    if (requestIdleCallbacks.length === 0) {
      setSendIdleEvents(false);
    }
    errors.forEach(function (error) {
      return JSTimers.setTimeout(function () {
        throw error;
      }, 0);
    });
  },
  callReactNativeMicrotasks: function callReactNativeMicrotasks() {
    errors.length = 0;
    while (_callReactNativeMicrotasksPass()) {}
    errors.forEach(function (error) {
      return JSTimers.setTimeout(function () {
        throw error;
      }, 0);
    });
  },
  emitTimeDriftWarning: function emitTimeDriftWarning(warningMessage) {
    if (hasEmittedTimeDriftWarning) {
      return;
    }
    hasEmittedTimeDriftWarning = true;
    console.warn(warningMessage);
  }
};
function createTimer(callbackID, duration, jsSchedulingTime, repeats) {
  invariant(_NativeTiming.default, 'NativeTiming is available');
  _NativeTiming.default.createTimer(callbackID, duration, jsSchedulingTime, repeats);
}
function deleteTimer(timerID) {
  invariant(_NativeTiming.default, 'NativeTiming is available');
  _NativeTiming.default.deleteTimer(timerID);
}
function setSendIdleEvents(sendIdleEvents) {
  invariant(_NativeTiming.default, 'NativeTiming is available');
  _NativeTiming.default.setSendIdleEvents(sendIdleEvents);
}
var ExportedJSTimers;
if (!_NativeTiming.default) {
  console.warn("Timing native module is not available, can't set timers.");
  ExportedJSTimers = {
    callReactNativeMicrotasks: JSTimers.callReactNativeMicrotasks,
    queueReactNativeMicrotask: JSTimers.queueReactNativeMicrotask
  };
} else {
  ExportedJSTimers = JSTimers;
}
BatchedBridge.setReactNativeMicrotasksCallback(JSTimers.callReactNativeMicrotasks);
module.exports = ExportedJSTimers;
//# sourceMappingURL=JSTimers.js.map