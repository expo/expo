'use strict';

var invariant = require('invariant');
var levelsMap = {
  log: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error'
};
var warningHandler = null;
var RCTLog = {
  logIfNoNativeHook: function logIfNoNativeHook(level) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    if (typeof global.nativeLoggingHook === 'undefined') {
      RCTLog.logToConsole.apply(RCTLog, [level].concat(args));
    } else {
      if (warningHandler && level === 'warn') {
        warningHandler.apply(void 0, args);
      }
    }
  },
  logToConsole: function logToConsole(level) {
    var _console;
    var logFn = levelsMap[level];
    invariant(logFn, 'Level "' + level + '" not one of ' + Object.keys(levelsMap).toString());
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    (_console = console)[logFn].apply(_console, args);
  },
  setWarningHandler: function setWarningHandler(handler) {
    warningHandler = handler;
  }
};
module.exports = RCTLog;
//# sourceMappingURL=RCTLog.js.map