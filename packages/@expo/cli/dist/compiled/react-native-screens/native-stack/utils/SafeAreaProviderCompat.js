Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SafeAreaProviderCompat;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _reactNativeSafeAreaContext = require("react-native-safe-area-context");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var _Dimensions$get = _reactNative.Dimensions.get('window'),
  _Dimensions$get$width = _Dimensions$get.width,
  width = _Dimensions$get$width === void 0 ? 0 : _Dimensions$get$width,
  _Dimensions$get$heigh = _Dimensions$get.height,
  height = _Dimensions$get$heigh === void 0 ? 0 : _Dimensions$get$heigh;
var initialMetrics = _reactNative.Platform.OS === 'web' || _reactNativeSafeAreaContext.initialWindowMetrics == null ? {
  frame: {
    x: 0,
    y: 0,
    width: width,
    height: height
  },
  insets: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
} : _reactNativeSafeAreaContext.initialWindowMetrics;
function SafeAreaProviderCompat(_ref) {
  var _children = _ref.children,
    style = _ref.style;
  return (0, _jsxRuntime.jsx)(_reactNativeSafeAreaContext.SafeAreaInsetsContext.Consumer, {
    children: function children(insets) {
      if (insets) {
        return (0, _jsxRuntime.jsx)(_reactNative.View, {
          style: [styles.container, style],
          children: _children
        });
      }
      return (0, _jsxRuntime.jsx)(_reactNativeSafeAreaContext.SafeAreaProvider, {
        initialMetrics: initialMetrics,
        style: style,
        children: _children
      });
    }
  });
}
SafeAreaProviderCompat.initialMetrics = initialMetrics;
var styles = _reactNative.StyleSheet.create({
  container: {
    flex: 1
  }
});