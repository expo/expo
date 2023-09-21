var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeErrorManager = _interopRequireDefault(require("./NativeErrorManager"));
var _EventEmitter = require("../EventEmitter");
var _Platform = _interopRequireDefault(require("../Platform"));
var _CodedError = require("../errors/CodedError");
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