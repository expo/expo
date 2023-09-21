var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  enableScreens: true,
  screensEnabled: true,
  enableFreeze: true,
  NativeScreen: true,
  Screen: true,
  InnerScreen: true,
  ScreenContext: true,
  ScreenContainer: true,
  NativeScreenContainer: true,
  NativeScreenNavigationContainer: true,
  ScreenStack: true,
  FullWindowOverlay: true,
  ScreenStackHeaderBackButtonImage: true,
  ScreenStackHeaderRightView: true,
  ScreenStackHeaderLeftView: true,
  ScreenStackHeaderCenterView: true,
  ScreenStackHeaderSearchBarView: true,
  ScreenStackHeaderConfig: true,
  SearchBar: true,
  ScreenStackHeaderSubview: true,
  shouldUseActivityState: true,
  useTransitionProgress: true,
  isSearchBarAvailableForCurrentPlatform: true,
  isNewBackTitleImplementation: true,
  executeNativeBackPress: true
};
exports.SearchBar = exports.ScreenStackHeaderSubview = exports.ScreenStackHeaderSearchBarView = exports.ScreenStackHeaderRightView = exports.ScreenStackHeaderLeftView = exports.ScreenStackHeaderConfig = exports.ScreenStackHeaderCenterView = exports.ScreenStackHeaderBackButtonImage = exports.ScreenStack = exports.ScreenContext = exports.ScreenContainer = exports.Screen = exports.NativeScreenNavigationContainer = exports.NativeScreenContainer = exports.NativeScreen = exports.InnerScreen = exports.FullWindowOverlay = void 0;
exports.enableFreeze = enableFreeze;
exports.enableScreens = enableScreens;
Object.defineProperty(exports, "executeNativeBackPress", {
  enumerable: true,
  get: function get() {
    return _utils.executeNativeBackPress;
  }
});
Object.defineProperty(exports, "isNewBackTitleImplementation", {
  enumerable: true,
  get: function get() {
    return _utils.isNewBackTitleImplementation;
  }
});
Object.defineProperty(exports, "isSearchBarAvailableForCurrentPlatform", {
  enumerable: true,
  get: function get() {
    return _utils.isSearchBarAvailableForCurrentPlatform;
  }
});
exports.screensEnabled = screensEnabled;
exports.shouldUseActivityState = void 0;
Object.defineProperty(exports, "useTransitionProgress", {
  enumerable: true,
  get: function get() {
    return _useTransitionProgress.default;
  }
});
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _react = _interopRequireDefault(require("react"));
var _reactNative = require("react-native");
var _jsxRuntime = require("react/jsx-runtime");
var _types = require("./types");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _types[key];
    }
  });
});
var _useTransitionProgress = _interopRequireDefault(require("./useTransitionProgress"));
var _utils = require("./utils");
var _excluded = ["active", "activityState", "style", "enabled"];
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ENABLE_SCREENS = true;
function enableScreens() {
  var shouldEnableScreens = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  ENABLE_SCREENS = shouldEnableScreens;
}
function screensEnabled() {
  return ENABLE_SCREENS;
}
function enableFreeze() {
  var shouldEnableReactFreeze = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
}
var NativeScreen = function (_React$Component) {
  (0, _inherits2.default)(NativeScreen, _React$Component);
  var _super = _createSuper(NativeScreen);
  function NativeScreen() {
    (0, _classCallCheck2.default)(this, NativeScreen);
    return _super.apply(this, arguments);
  }
  (0, _createClass2.default)(NativeScreen, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
        active = _this$props.active,
        activityState = _this$props.activityState,
        style = _this$props.style,
        _this$props$enabled = _this$props.enabled,
        enabled = _this$props$enabled === void 0 ? ENABLE_SCREENS : _this$props$enabled,
        rest = (0, _objectWithoutProperties2.default)(_this$props, _excluded);
      if (enabled) {
        if (active !== undefined && activityState === undefined) {
          activityState = active !== 0 ? 2 : 0;
        }
        return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({
          hidden: activityState === 0,
          style: [style, {
            display: activityState !== 0 ? 'flex' : 'none'
          }]
        }, rest));
      }
      return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, rest));
    }
  }]);
  return NativeScreen;
}(_react.default.Component);
exports.NativeScreen = NativeScreen;
var Screen = _reactNative.Animated.createAnimatedComponent(NativeScreen);
exports.Screen = Screen;
var InnerScreen = _reactNative.View;
exports.InnerScreen = InnerScreen;
var ScreenContext = _react.default.createContext(Screen);
exports.ScreenContext = ScreenContext;
var ScreenContainer = _reactNative.View;
exports.ScreenContainer = ScreenContainer;
var NativeScreenContainer = _reactNative.View;
exports.NativeScreenContainer = NativeScreenContainer;
var NativeScreenNavigationContainer = _reactNative.View;
exports.NativeScreenNavigationContainer = NativeScreenNavigationContainer;
var ScreenStack = _reactNative.View;
exports.ScreenStack = ScreenStack;
var FullWindowOverlay = _reactNative.View;
exports.FullWindowOverlay = FullWindowOverlay;
var ScreenStackHeaderBackButtonImage = function ScreenStackHeaderBackButtonImage(props) {
  return (0, _jsxRuntime.jsx)(_reactNative.View, {
    children: (0, _jsxRuntime.jsx)(_reactNative.Image, Object.assign({
      resizeMode: "center",
      fadeDuration: 0
    }, props))
  });
};
exports.ScreenStackHeaderBackButtonImage = ScreenStackHeaderBackButtonImage;
var ScreenStackHeaderRightView = function ScreenStackHeaderRightView(props) {
  return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, props));
};
exports.ScreenStackHeaderRightView = ScreenStackHeaderRightView;
var ScreenStackHeaderLeftView = function ScreenStackHeaderLeftView(props) {
  return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, props));
};
exports.ScreenStackHeaderLeftView = ScreenStackHeaderLeftView;
var ScreenStackHeaderCenterView = function ScreenStackHeaderCenterView(props) {
  return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, props));
};
exports.ScreenStackHeaderCenterView = ScreenStackHeaderCenterView;
var ScreenStackHeaderSearchBarView = function ScreenStackHeaderSearchBarView(props) {
  return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, props));
};
exports.ScreenStackHeaderSearchBarView = ScreenStackHeaderSearchBarView;
var ScreenStackHeaderConfig = function ScreenStackHeaderConfig(props) {
  return (0, _jsxRuntime.jsx)(_reactNative.View, Object.assign({}, props));
};
exports.ScreenStackHeaderConfig = ScreenStackHeaderConfig;
var SearchBar = _reactNative.View;
exports.SearchBar = SearchBar;
var ScreenStackHeaderSubview = _reactNative.View;
exports.ScreenStackHeaderSubview = ScreenStackHeaderSubview;
var shouldUseActivityState = true;
exports.shouldUseActivityState = shouldUseActivityState;