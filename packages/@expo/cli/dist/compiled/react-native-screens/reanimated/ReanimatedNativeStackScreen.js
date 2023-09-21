var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _reactNativeScreens = require("react-native-screens");
var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));
var _ReanimatedTransitionProgressContext = _interopRequireDefault(require("./ReanimatedTransitionProgressContext"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["children"];
var _global;
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var AnimatedScreen = _reactNativeReanimated.default.createAnimatedComponent(_reactNativeScreens.InnerScreen);
var ENABLE_FABRIC = !!((_global = global) != null && _global._IS_FABRIC);
var ReanimatedNativeStackScreen = _react.default.forwardRef(function (props, ref) {
  var children = props.children,
    rest = (0, _objectWithoutProperties2.default)(props, _excluded);
  var progress = (0, _reactNativeReanimated.useSharedValue)(0);
  var closing = (0, _reactNativeReanimated.useSharedValue)(0);
  var goingForward = (0, _reactNativeReanimated.useSharedValue)(0);
  return (0, _jsxRuntime.jsx)(AnimatedScreen, Object.assign({
    ref: ref,
    onTransitionProgressReanimated: (0, _reactNativeReanimated.useEvent)(function (event) {
      'worklet';

      progress.value = event.progress;
      closing.value = event.closing;
      goingForward.value = event.goingForward;
    }, [_reactNative.Platform.OS === 'android' ? 'onTransitionProgress' : ENABLE_FABRIC ? 'onTransitionProgress' : 'topTransitionProgress'])
  }, rest, {
    children: (0, _jsxRuntime.jsx)(_ReanimatedTransitionProgressContext.default.Provider, {
      value: {
        progress: progress,
        closing: closing,
        goingForward: goingForward
      },
      children: children
    })
  }));
});
ReanimatedNativeStackScreen.displayName = 'ReanimatedNativeStackScreen';
var _default = ReanimatedNativeStackScreen;
exports.default = _default;