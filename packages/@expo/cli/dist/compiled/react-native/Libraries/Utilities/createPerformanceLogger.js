var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createPerformanceLogger;
exports.getCurrentTimestamp = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var Systrace = _interopRequireWildcard(require("../Performance/Systrace"));
var _Performance = _interopRequireDefault(require("../WebPerformance/Performance"));
var _infoLog = _interopRequireDefault(require("./infoLog"));
var _global$nativeQPLTime;
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var _cookies = {};
var PRINT_TO_CONSOLE = false;
var WEB_PERFORMANCE_PREFIX = 'global_perf_';
var performance = new _Performance.default();
var getCurrentTimestamp = (_global$nativeQPLTime = global.nativeQPLTimestamp) != null ? _global$nativeQPLTime : global.performance.now.bind(global.performance);
exports.getCurrentTimestamp = getCurrentTimestamp;
var PerformanceLogger = function () {
  function PerformanceLogger(isLoggingForWebPerformance) {
    (0, _classCallCheck2.default)(this, PerformanceLogger);
    this._timespans = {};
    this._extras = {};
    this._points = {};
    this._pointExtras = {};
    this._closed = false;
    this._isLoggingForWebPerformance = false;
    this._isLoggingForWebPerformance = isLoggingForWebPerformance === true;
  }
  (0, _createClass2.default)(PerformanceLogger, [{
    key: "addTimespan",
    value: function addTimespan(key, startTime, endTime, startExtras, endExtras) {
      if (this._closed) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: addTimespan - has closed ignoring: ', key);
        }
        return;
      }
      if (this._timespans[key]) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: Attempting to add a timespan that already exists ', key);
        }
        return;
      }
      this._timespans[key] = {
        startTime: startTime,
        endTime: endTime,
        totalTime: endTime - (startTime || 0),
        startExtras: startExtras,
        endExtras: endExtras
      };
      if (this._isLoggingForWebPerformance) {
        performance.measure(`${WEB_PERFORMANCE_PREFIX}_${key}`, {
          start: startTime,
          end: endTime
        });
      }
    }
  }, {
    key: "append",
    value: function append(performanceLogger) {
      this._timespans = Object.assign({}, performanceLogger.getTimespans(), this._timespans);
      this._extras = Object.assign({}, performanceLogger.getExtras(), this._extras);
      this._points = Object.assign({}, performanceLogger.getPoints(), this._points);
      this._pointExtras = Object.assign({}, performanceLogger.getPointExtras(), this._pointExtras);
    }
  }, {
    key: "clear",
    value: function clear() {
      this._timespans = {};
      this._extras = {};
      this._points = {};
      if (PRINT_TO_CONSOLE) {
        (0, _infoLog.default)('PerformanceLogger.js', 'clear');
      }
    }
  }, {
    key: "clearCompleted",
    value: function clearCompleted() {
      for (var _key in this._timespans) {
        var _this$_timespans$_key;
        if (((_this$_timespans$_key = this._timespans[_key]) == null ? void 0 : _this$_timespans$_key.totalTime) != null) {
          delete this._timespans[_key];
        }
      }
      this._extras = {};
      this._points = {};
      if (PRINT_TO_CONSOLE) {
        (0, _infoLog.default)('PerformanceLogger.js', 'clearCompleted');
      }
    }
  }, {
    key: "close",
    value: function close() {
      this._closed = true;
    }
  }, {
    key: "currentTimestamp",
    value: function currentTimestamp() {
      return getCurrentTimestamp();
    }
  }, {
    key: "getExtras",
    value: function getExtras() {
      return this._extras;
    }
  }, {
    key: "getPoints",
    value: function getPoints() {
      return this._points;
    }
  }, {
    key: "getPointExtras",
    value: function getPointExtras() {
      return this._pointExtras;
    }
  }, {
    key: "getTimespans",
    value: function getTimespans() {
      return this._timespans;
    }
  }, {
    key: "hasTimespan",
    value: function hasTimespan(key) {
      return !!this._timespans[key];
    }
  }, {
    key: "isClosed",
    value: function isClosed() {
      return this._closed;
    }
  }, {
    key: "logEverything",
    value: function logEverything() {
      if (PRINT_TO_CONSOLE) {
        for (var _key2 in this._timespans) {
          var _this$_timespans$_key2;
          if (((_this$_timespans$_key2 = this._timespans[_key2]) == null ? void 0 : _this$_timespans$_key2.totalTime) != null) {
            (0, _infoLog.default)(_key2 + ': ' + this._timespans[_key2].totalTime + 'ms');
          }
        }
        (0, _infoLog.default)(this._extras);
        for (var _key3 in this._points) {
          if (this._points[_key3] != null) {
            (0, _infoLog.default)(_key3 + ': ' + this._points[_key3] + 'ms');
          }
        }
      }
    }
  }, {
    key: "markPoint",
    value: function markPoint(key) {
      var timestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getCurrentTimestamp();
      var extras = arguments.length > 2 ? arguments[2] : undefined;
      if (this._closed) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: markPoint - has closed ignoring: ', key);
        }
        return;
      }
      if (this._points[key] != null) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: Attempting to mark a point that has been already logged ', key);
        }
        return;
      }
      this._points[key] = timestamp;
      if (extras) {
        this._pointExtras[key] = extras;
      }
      if (this._isLoggingForWebPerformance) {
        performance.mark(`${WEB_PERFORMANCE_PREFIX}_${key}`, {
          startTime: timestamp
        });
      }
    }
  }, {
    key: "removeExtra",
    value: function removeExtra(key) {
      var value = this._extras[key];
      delete this._extras[key];
      return value;
    }
  }, {
    key: "setExtra",
    value: function setExtra(key, value) {
      if (this._closed) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: setExtra - has closed ignoring: ', key);
        }
        return;
      }
      if (this._extras.hasOwnProperty(key)) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: Attempting to set an extra that already exists ', {
            key: key,
            currentValue: this._extras[key],
            attemptedValue: value
          });
        }
        return;
      }
      this._extras[key] = value;
    }
  }, {
    key: "startTimespan",
    value: function startTimespan(key) {
      var timestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getCurrentTimestamp();
      var extras = arguments.length > 2 ? arguments[2] : undefined;
      if (this._closed) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: startTimespan - has closed ignoring: ', key);
        }
        return;
      }
      if (this._timespans[key]) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: Attempting to start a timespan that already exists ', key);
        }
        return;
      }
      this._timespans[key] = {
        startTime: timestamp,
        startExtras: extras
      };
      _cookies[key] = Systrace.beginAsyncEvent(key);
      if (PRINT_TO_CONSOLE) {
        (0, _infoLog.default)('PerformanceLogger.js', 'start: ' + key);
      }
      if (this._isLoggingForWebPerformance) {
        performance.mark(`${WEB_PERFORMANCE_PREFIX}_timespan_start_${key}`, {
          startTime: timestamp
        });
      }
    }
  }, {
    key: "stopTimespan",
    value: function stopTimespan(key) {
      var timestamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getCurrentTimestamp();
      var extras = arguments.length > 2 ? arguments[2] : undefined;
      if (this._closed) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: stopTimespan - has closed ignoring: ', key);
        }
        return;
      }
      var timespan = this._timespans[key];
      if (!timespan || timespan.startTime == null) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: Attempting to end a timespan that has not started ', key);
        }
        return;
      }
      if (timespan.endTime != null) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          (0, _infoLog.default)('PerformanceLogger: Attempting to end a timespan that has already ended ', key);
        }
        return;
      }
      timespan.endExtras = extras;
      timespan.endTime = timestamp;
      timespan.totalTime = timespan.endTime - (timespan.startTime || 0);
      if (PRINT_TO_CONSOLE) {
        (0, _infoLog.default)('PerformanceLogger.js', 'end: ' + key);
      }
      if (_cookies[key] != null) {
        Systrace.endAsyncEvent(key, _cookies[key]);
        delete _cookies[key];
      }
      if (this._isLoggingForWebPerformance) {
        performance.measure(`${WEB_PERFORMANCE_PREFIX}_${key}`, {
          start: `${WEB_PERFORMANCE_PREFIX}_timespan_start_${key}`,
          end: timestamp
        });
      }
    }
  }]);
  return PerformanceLogger;
}();
function createPerformanceLogger(isLoggingForWebPerformance) {
  return new PerformanceLogger(isLoggingForWebPerformance);
}