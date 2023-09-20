Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.beginAsyncEvent = beginAsyncEvent;
exports.beginEvent = beginEvent;
exports.counterEvent = counterEvent;
exports.endAsyncEvent = endAsyncEvent;
exports.endEvent = endEvent;
exports.isEnabled = isEnabled;
exports.setEnabled = setEnabled;
var TRACE_TAG_REACT_APPS = 1 << 17;
var _asyncCookie = 0;
function isEnabled() {
  return global.nativeTraceIsTracing ? global.nativeTraceIsTracing(TRACE_TAG_REACT_APPS) : Boolean(global.__RCTProfileIsProfiling);
}
function setEnabled(_doEnable) {}
function beginEvent(eventName, args) {
  if (isEnabled()) {
    var eventNameString = typeof eventName === 'function' ? eventName() : eventName;
    global.nativeTraceBeginSection(TRACE_TAG_REACT_APPS, eventNameString, args);
  }
}
function endEvent(args) {
  if (isEnabled()) {
    global.nativeTraceEndSection(TRACE_TAG_REACT_APPS, args);
  }
}
function beginAsyncEvent(eventName, args) {
  var cookie = _asyncCookie;
  if (isEnabled()) {
    _asyncCookie++;
    var eventNameString = typeof eventName === 'function' ? eventName() : eventName;
    global.nativeTraceBeginAsyncSection(TRACE_TAG_REACT_APPS, eventNameString, cookie, args);
  }
  return cookie;
}
function endAsyncEvent(eventName, cookie, args) {
  if (isEnabled()) {
    var eventNameString = typeof eventName === 'function' ? eventName() : eventName;
    global.nativeTraceEndAsyncSection(TRACE_TAG_REACT_APPS, eventNameString, cookie, args);
  }
}
function counterEvent(eventName, value) {
  if (isEnabled()) {
    var eventNameString = typeof eventName === 'function' ? eventName() : eventName;
    global.nativeTraceCounter && global.nativeTraceCounter(TRACE_TAG_REACT_APPS, eventNameString, value);
  }
}
if (__DEV__) {
  var Systrace = {
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    beginEvent: beginEvent,
    endEvent: endEvent,
    beginAsyncEvent: beginAsyncEvent,
    endAsyncEvent: endAsyncEvent,
    counterEvent: counterEvent
  };
  global[(global.__METRO_GLOBAL_PREFIX__ || '') + '__SYSTRACE'] = Systrace;
}
//# sourceMappingURL=Systrace.js.map