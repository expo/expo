var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Commands = void 0;
var _codegenNativeComponent = _interopRequireDefault(require("react-native/Libraries/Utilities/codegenNativeComponent"));
var _codegenNativeCommands = _interopRequireDefault(require("react-native/Libraries/Utilities/codegenNativeCommands"));
var Commands = (0, _codegenNativeCommands.default)({
  supportedCommands: ['blur', 'focus', 'clearText', 'toggleCancelButton', 'setText']
});
exports.Commands = Commands;
var _default = (0, _codegenNativeComponent.default)('RNSSearchBar', {});
exports.default = _default;