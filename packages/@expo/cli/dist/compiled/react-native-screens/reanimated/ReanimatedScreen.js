var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _reactNativeScreens = require("react-native-screens");
var _reactNativeReanimated = _interopRequireDefault(require("react-native-reanimated"));
var _jsxRuntime = require("react/jsx-runtime");
var AnimatedScreen = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeScreens.InnerScreen);
var ReanimatedScreen = _react.default.forwardRef(function (props, ref) {
  return (0, _jsxRuntime.jsx)(AnimatedScreen, Object.assign({
    ref: ref
  }, props));
});
ReanimatedScreen.displayName = 'ReanimatedScreen';
var _default = ReanimatedScreen;
exports.default = _default;