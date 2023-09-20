'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var SyntheticError = function (_Error) {
  (0, _inherits2.default)(SyntheticError, _Error);
  var _super = _createSuper(SyntheticError);
  function SyntheticError() {
    var _this;
    (0, _classCallCheck2.default)(this, SyntheticError);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this.name = '';
    return _this;
  }
  return (0, _createClass2.default)(SyntheticError);
}((0, _wrapNativeSuper2.default)(Error));
var userExceptionDecorator;
var inUserExceptionDecorator = false;
var decoratedExtraDataKey = Symbol('decoratedExtraDataKey');
function unstable_setExceptionDecorator(exceptionDecorator) {
  userExceptionDecorator = exceptionDecorator;
}
function preprocessException(data) {
  if (userExceptionDecorator && !inUserExceptionDecorator) {
    inUserExceptionDecorator = true;
    try {
      return userExceptionDecorator(data);
    } catch (_unused) {} finally {
      inUserExceptionDecorator = false;
    }
  }
  return data;
}
var exceptionID = 0;
function reportException(e, isFatal, reportToConsole) {
  var parseErrorStack = require('./Devtools/parseErrorStack');
  var stack = parseErrorStack(e == null ? void 0 : e.stack);
  var currentExceptionID = ++exceptionID;
  var originalMessage = e.message || '';
  var message = originalMessage;
  if (e.componentStack != null) {
    message += `\n\nThis error is located at:${e.componentStack}`;
  }
  var namePrefix = e.name == null || e.name === '' ? '' : `${e.name}: `;
  if (!message.startsWith(namePrefix)) {
    message = namePrefix + message;
  }
  message = e.jsEngine == null ? message : `${message}, js engine: ${e.jsEngine}`;
  var data = preprocessException({
    message: message,
    originalMessage: message === originalMessage ? null : originalMessage,
    name: e.name == null || e.name === '' ? null : e.name,
    componentStack: typeof e.componentStack === 'string' ? e.componentStack : null,
    stack: stack,
    id: currentExceptionID,
    isFatal: isFatal,
    extraData: Object.assign({}, e[decoratedExtraDataKey], {
      jsEngine: e.jsEngine,
      rawStack: e.stack
    })
  });
  if (reportToConsole) {
    console.error(data.message);
  }
  if (__DEV__) {
    var LogBox = require('../LogBox/LogBox').default;
    LogBox.addException(Object.assign({}, data, {
      isComponentError: !!e.isComponentError
    }));
  } else if (isFatal || e.type !== 'warn') {
    var NativeExceptionsManager = require('./NativeExceptionsManager').default;
    if (NativeExceptionsManager) {
      NativeExceptionsManager.reportException(data);
    }
  }
}
var inExceptionHandler = false;
function handleException(e, isFatal) {
  var error;
  if (e instanceof Error) {
    error = e;
  } else {
    error = new SyntheticError(e);
  }
  try {
    inExceptionHandler = true;
    reportException(error, isFatal, true);
  } finally {
    inExceptionHandler = false;
  }
}
function reactConsoleErrorHandler() {
  var _console;
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }
  (_console = console)._errorOriginal.apply(_console, args);
  if (!console.reportErrorsAsExceptions) {
    return;
  }
  if (inExceptionHandler) {
    return;
  }
  var error;
  var firstArg = args[0];
  if (firstArg != null && firstArg.stack) {
    error = firstArg;
  } else {
    var stringifySafe = require('../Utilities/stringifySafe').default;
    if (typeof firstArg === 'string' && firstArg.startsWith('Warning: ')) {
      return;
    }
    var message = args.map(function (arg) {
      return typeof arg === 'string' ? arg : stringifySafe(arg);
    }).join(' ');
    error = new SyntheticError(message);
    error.name = 'console.error';
  }
  reportException(error, false, false);
}
function installConsoleErrorReporter() {
  if (console._errorOriginal) {
    return;
  }
  console._errorOriginal = console.error.bind(console);
  console.error = reactConsoleErrorHandler;
  if (console.reportErrorsAsExceptions === undefined) {
    console.reportErrorsAsExceptions = true;
  }
}
module.exports = {
  decoratedExtraDataKey: decoratedExtraDataKey,
  handleException: handleException,
  installConsoleErrorReporter: installConsoleErrorReporter,
  SyntheticError: SyntheticError,
  unstable_setExceptionDecorator: unstable_setExceptionDecorator
};
//# sourceMappingURL=ExceptionsManager.js.map