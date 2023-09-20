var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addException = addException;
exports.addIgnorePatterns = addIgnorePatterns;
exports.addLog = addLog;
exports.checkWarningFilter = checkWarningFilter;
exports.clear = clear;
exports.clearErrors = clearErrors;
exports.clearWarnings = clearWarnings;
exports.dismiss = dismiss;
exports.getAppInfo = getAppInfo;
exports.getIgnorePatterns = getIgnorePatterns;
exports.isDisabled = isDisabled;
exports.isLogBoxErrorMessage = isLogBoxErrorMessage;
exports.isMessageIgnored = isMessageIgnored;
exports.observe = observe;
exports.reportLogBoxError = reportLogBoxError;
exports.retrySymbolicateLogNow = retrySymbolicateLogNow;
exports.setAppInfo = setAppInfo;
exports.setDisabled = setDisabled;
exports.setSelectedLog = setSelectedLog;
exports.setWarningFilter = setWarningFilter;
exports.symbolicateLogLazy = symbolicateLogLazy;
exports.symbolicateLogNow = symbolicateLogNow;
exports.withSubscription = withSubscription;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _parseErrorStack = _interopRequireDefault(require("../../Core/Devtools/parseErrorStack"));
var _NativeLogBox = _interopRequireDefault(require("../../NativeModules/specs/NativeLogBox"));
var _LogBoxLog = _interopRequireDefault(require("./LogBoxLog"));
var _parseLogBoxLog = require("./parseLogBoxLog");
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
'use strict';
var observers = new Set();
var ignorePatterns = new Set();
var appInfo = null;
var logs = new Set();
var updateTimeout = null;
var _isDisabled = false;
var _selectedIndex = -1;
var warningFilter = function warningFilter(format) {
  return {
    finalFormat: format,
    forceDialogImmediately: false,
    suppressDialog_LEGACY: true,
    suppressCompletely: false,
    monitorEvent: 'unknown',
    monitorListVersion: 0,
    monitorSampleRate: 1
  };
};
var LOGBOX_ERROR_MESSAGE = 'An error was thrown when attempting to render log messages via LogBox.';
function getNextState() {
  return {
    logs: logs,
    isDisabled: _isDisabled,
    selectedLogIndex: _selectedIndex
  };
}
function reportLogBoxError(error, componentStack) {
  var ExceptionsManager = require("../../Core/ExceptionsManager");
  error.message = `${LOGBOX_ERROR_MESSAGE}\n\n${error.message}`;
  if (componentStack != null) {
    error.componentStack = componentStack;
  }
  ExceptionsManager.handleException(error, true);
}
function isLogBoxErrorMessage(message) {
  return typeof message === 'string' && message.includes(LOGBOX_ERROR_MESSAGE);
}
function isMessageIgnored(message) {
  for (var pattern of ignorePatterns) {
    if (pattern instanceof RegExp && pattern.test(message) || typeof pattern === 'string' && message.includes(pattern)) {
      return true;
    }
  }
  return false;
}
function handleUpdate() {
  if (updateTimeout == null) {
    updateTimeout = setImmediate(function () {
      updateTimeout = null;
      var nextState = getNextState();
      observers.forEach(function (_ref) {
        var observer = _ref.observer;
        return observer(nextState);
      });
    });
  }
}
function appendNewLog(newLog) {
  if (isMessageIgnored(newLog.message.content)) {
    return;
  }
  var lastLog = Array.from(logs).pop();
  if (lastLog && lastLog.category === newLog.category) {
    lastLog.incrementCount();
    handleUpdate();
    return;
  }
  if (newLog.level === 'fatal') {
    var OPTIMISTIC_WAIT_TIME = 1000;
    var _addPendingLog = function addPendingLog() {
      logs.add(newLog);
      if (_selectedIndex < 0) {
        setSelectedLog(logs.size - 1);
      } else {
        handleUpdate();
      }
      _addPendingLog = null;
    };
    var optimisticTimeout = setTimeout(function () {
      if (_addPendingLog) {
        _addPendingLog();
      }
    }, OPTIMISTIC_WAIT_TIME);
    newLog.symbolicate(function (status) {
      if (_addPendingLog && status !== 'PENDING') {
        _addPendingLog();
        clearTimeout(optimisticTimeout);
      } else if (status !== 'PENDING') {
        handleUpdate();
      }
    });
  } else if (newLog.level === 'syntax') {
    logs.add(newLog);
    setSelectedLog(logs.size - 1);
  } else {
    logs.add(newLog);
    handleUpdate();
  }
}
function addLog(log) {
  var errorForStackTrace = new Error();
  setImmediate(function () {
    try {
      var stack = (0, _parseErrorStack.default)(errorForStackTrace == null ? void 0 : errorForStackTrace.stack);
      appendNewLog(new _LogBoxLog.default({
        level: log.level,
        message: log.message,
        isComponentError: false,
        stack: stack,
        category: log.category,
        componentStack: log.componentStack
      }));
    } catch (error) {
      reportLogBoxError(error);
    }
  });
}
function addException(error) {
  setImmediate(function () {
    try {
      appendNewLog(new _LogBoxLog.default((0, _parseLogBoxLog.parseLogBoxException)(error)));
    } catch (loggingError) {
      reportLogBoxError(loggingError);
    }
  });
}
function symbolicateLogNow(log) {
  log.symbolicate(function () {
    handleUpdate();
  });
}
function retrySymbolicateLogNow(log) {
  log.retrySymbolicate(function () {
    handleUpdate();
  });
}
function symbolicateLogLazy(log) {
  log.symbolicate();
}
function clear() {
  if (logs.size > 0) {
    logs = new Set();
    setSelectedLog(-1);
  }
}
function setSelectedLog(proposedNewIndex) {
  var oldIndex = _selectedIndex;
  var newIndex = proposedNewIndex;
  var logArray = Array.from(logs);
  var index = logArray.length - 1;
  while (index >= 0) {
    if (logArray[index].level === 'syntax') {
      newIndex = index;
      break;
    }
    index -= 1;
  }
  _selectedIndex = newIndex;
  handleUpdate();
  if (_NativeLogBox.default) {
    setTimeout(function () {
      if (oldIndex < 0 && newIndex >= 0) {
        _NativeLogBox.default.show();
      } else if (oldIndex >= 0 && newIndex < 0) {
        _NativeLogBox.default.hide();
      }
    }, 0);
  }
}
function clearWarnings() {
  var newLogs = Array.from(logs).filter(function (log) {
    return log.level !== 'warn';
  });
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    setSelectedLog(-1);
    handleUpdate();
  }
}
function clearErrors() {
  var newLogs = Array.from(logs).filter(function (log) {
    return log.level !== 'error' && log.level !== 'fatal';
  });
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    setSelectedLog(-1);
  }
}
function dismiss(log) {
  if (logs.has(log)) {
    logs.delete(log);
    handleUpdate();
  }
}
function setWarningFilter(filter) {
  warningFilter = filter;
}
function setAppInfo(info) {
  appInfo = info;
}
function getAppInfo() {
  return appInfo != null ? appInfo() : null;
}
function checkWarningFilter(format) {
  return warningFilter(format);
}
function getIgnorePatterns() {
  return Array.from(ignorePatterns);
}
function addIgnorePatterns(patterns) {
  var existingSize = ignorePatterns.size;
  patterns.forEach(function (pattern) {
    if (pattern instanceof RegExp) {
      for (var existingPattern of ignorePatterns) {
        if (existingPattern instanceof RegExp && existingPattern.toString() === pattern.toString()) {
          return;
        }
      }
      ignorePatterns.add(pattern);
    }
    ignorePatterns.add(pattern);
  });
  if (ignorePatterns.size === existingSize) {
    return;
  }
  logs = new Set(Array.from(logs).filter(function (log) {
    return !isMessageIgnored(log.message.content);
  }));
  handleUpdate();
}
function setDisabled(value) {
  if (value === _isDisabled) {
    return;
  }
  _isDisabled = value;
  handleUpdate();
}
function isDisabled() {
  return _isDisabled;
}
function observe(observer) {
  var subscription = {
    observer: observer
  };
  observers.add(subscription);
  observer(getNextState());
  return {
    unsubscribe: function unsubscribe() {
      observers.delete(subscription);
    }
  };
}
function withSubscription(WrappedComponent) {
  var LogBoxStateSubscription = function (_React$Component) {
    (0, _inherits2.default)(LogBoxStateSubscription, _React$Component);
    var _super = _createSuper(LogBoxStateSubscription);
    function LogBoxStateSubscription() {
      var _this;
      (0, _classCallCheck2.default)(this, LogBoxStateSubscription);
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _super.call.apply(_super, [this].concat(args));
      _this.state = {
        logs: new Set(),
        isDisabled: false,
        hasError: false,
        selectedLogIndex: -1
      };
      _this._handleDismiss = function () {
        var _this$state = _this.state,
          selectedLogIndex = _this$state.selectedLogIndex,
          stateLogs = _this$state.logs;
        var logsArray = Array.from(stateLogs);
        if (selectedLogIndex != null) {
          if (logsArray.length - 1 <= 0) {
            setSelectedLog(-1);
          } else if (selectedLogIndex >= logsArray.length - 1) {
            setSelectedLog(selectedLogIndex - 1);
          }
          dismiss(logsArray[selectedLogIndex]);
        }
      };
      _this._handleMinimize = function () {
        setSelectedLog(-1);
      };
      _this._handleSetSelectedLog = function (index) {
        setSelectedLog(index);
      };
      return _this;
    }
    (0, _createClass2.default)(LogBoxStateSubscription, [{
      key: "componentDidCatch",
      value: function componentDidCatch(err, errorInfo) {
        reportLogBoxError(err, errorInfo.componentStack);
      }
    }, {
      key: "render",
      value: function render() {
        if (this.state.hasError) {
          return null;
        }
        return (0, _jsxRuntime.jsx)(WrappedComponent, {
          logs: Array.from(this.state.logs),
          isDisabled: this.state.isDisabled,
          selectedLogIndex: this.state.selectedLogIndex
        });
      }
    }, {
      key: "componentDidMount",
      value: function componentDidMount() {
        var _this2 = this;
        this._subscription = observe(function (data) {
          _this2.setState(data);
        });
      }
    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        if (this._subscription != null) {
          this._subscription.unsubscribe();
        }
      }
    }], [{
      key: "getDerivedStateFromError",
      value: function getDerivedStateFromError() {
        return {
          hasError: true
        };
      }
    }]);
    return LogBoxStateSubscription;
  }(React.Component);
  return LogBoxStateSubscription;
}
//# sourceMappingURL=LogBoxData.js.map