var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var _RCTLog = _interopRequireDefault(require("../Utilities/RCTLog"));
var LogBox;
if (__DEV__) {
  var LogBoxData = require("./Data/LogBoxData");
  var _require = require("./Data/parseLogBoxLog"),
    parseLogBoxLog = _require.parseLogBoxLog,
    parseInterpolation = _require.parseInterpolation;
  var originalConsoleError;
  var originalConsoleWarn;
  var consoleErrorImpl;
  var consoleWarnImpl;
  var isLogBoxInstalled = false;
  LogBox = {
    install: function install() {
      if (isLogBoxInstalled) {
        return;
      }
      isLogBoxInstalled = true;
      require("../NativeModules/specs/NativeLogBox");
      var isFirstInstall = originalConsoleError == null;
      if (isFirstInstall) {
        originalConsoleError = console.error.bind(console);
        originalConsoleWarn = console.warn.bind(console);
        console.error = function () {
          consoleErrorImpl.apply(void 0, arguments);
        };
        console.warn = function () {
          consoleWarnImpl.apply(void 0, arguments);
        };
      }
      consoleErrorImpl = registerError;
      consoleWarnImpl = registerWarning;
      if (_Platform.default.isTesting) {
        LogBoxData.setDisabled(true);
      }
      _RCTLog.default.setWarningHandler(function () {
        registerWarning.apply(void 0, arguments);
      });
    },
    uninstall: function uninstall() {
      if (!isLogBoxInstalled) {
        return;
      }
      isLogBoxInstalled = false;
      consoleErrorImpl = originalConsoleError;
      consoleWarnImpl = originalConsoleWarn;
    },
    isInstalled: function isInstalled() {
      return isLogBoxInstalled;
    },
    ignoreLogs: function ignoreLogs(patterns) {
      LogBoxData.addIgnorePatterns(patterns);
    },
    ignoreAllLogs: function ignoreAllLogs(value) {
      LogBoxData.setDisabled(value == null ? true : value);
    },
    clearAllLogs: function clearAllLogs() {
      LogBoxData.clear();
    },
    addLog: function addLog(log) {
      if (isLogBoxInstalled) {
        LogBoxData.addLog(log);
      }
    },
    addException: function addException(error) {
      if (isLogBoxInstalled) {
        LogBoxData.addException(error);
      }
    }
  };
  var isRCTLogAdviceWarning = function isRCTLogAdviceWarning() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return typeof args[0] === 'string' && args[0].startsWith('(ADVICE)');
  };
  var isWarningModuleWarning = function isWarningModuleWarning() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return typeof args[0] === 'string' && args[0].startsWith('Warning: ');
  };
  var registerWarning = function registerWarning() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    if (LogBoxData.isLogBoxErrorMessage(String(args[0]))) {
      originalConsoleError.apply(void 0, args);
      return;
    } else {
      originalConsoleWarn.apply(void 0, args);
    }
    try {
      if (!isRCTLogAdviceWarning.apply(void 0, args)) {
        var _parseLogBoxLog = parseLogBoxLog(args),
          category = _parseLogBoxLog.category,
          message = _parseLogBoxLog.message,
          componentStack = _parseLogBoxLog.componentStack;
        if (!LogBoxData.isMessageIgnored(message.content)) {
          LogBoxData.addLog({
            level: 'warn',
            category: category,
            message: message,
            componentStack: componentStack
          });
        }
      }
    } catch (err) {
      LogBoxData.reportLogBoxError(err);
    }
  };
  var registerError = function registerError() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    if (LogBoxData.isLogBoxErrorMessage(args[0])) {
      originalConsoleError.apply(void 0, args);
      return;
    }
    try {
      if (!isWarningModuleWarning.apply(void 0, args)) {
        originalConsoleError.apply(void 0, args);
        return;
      }
      var format = args[0].replace('Warning: ', '');
      var filterResult = LogBoxData.checkWarningFilter(format);
      if (filterResult.suppressCompletely) {
        return;
      }
      var level = 'error';
      if (filterResult.suppressDialog_LEGACY === true) {
        level = 'warn';
      } else if (filterResult.forceDialogImmediately === true) {
        level = 'fatal';
      }
      args[0] = `Warning: ${filterResult.finalFormat}`;
      var _parseLogBoxLog2 = parseLogBoxLog(args),
        category = _parseLogBoxLog2.category,
        message = _parseLogBoxLog2.message,
        componentStack = _parseLogBoxLog2.componentStack;
      var interpolated = parseInterpolation(args);
      originalConsoleError(interpolated.message.content);
      if (!LogBoxData.isMessageIgnored(message.content)) {
        LogBoxData.addLog({
          level: level,
          category: category,
          message: message,
          componentStack: componentStack
        });
      }
    } catch (err) {
      LogBoxData.reportLogBoxError(err);
    }
  };
} else {
  LogBox = {
    install: function install() {},
    uninstall: function uninstall() {},
    isInstalled: function isInstalled() {
      return false;
    },
    ignoreLogs: function ignoreLogs(patterns) {},
    ignoreAllLogs: function ignoreAllLogs(value) {},
    clearAllLogs: function clearAllLogs() {},
    addLog: function addLog(log) {},
    addException: function addException(error) {}
  };
}
var _default = LogBox;
exports.default = _default;
//# sourceMappingURL=LogBox.js.map