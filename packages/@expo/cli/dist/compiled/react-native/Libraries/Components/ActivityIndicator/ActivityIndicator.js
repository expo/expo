'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _View = _interopRequireDefault(require("../View/View"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["animating", "color", "hidesWhenStopped", "onLayout", "size", "style"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var PlatformActivityIndicator = _Platform.default.OS === 'android' ? require('../ProgressBarAndroid/ProgressBarAndroid') : require('./ActivityIndicatorViewNativeComponent').default;
var GRAY = '#999999';
var ActivityIndicator = function ActivityIndicator(_ref, forwardedRef) {
  var _ref$animating = _ref.animating,
    animating = _ref$animating === void 0 ? true : _ref$animating,
    _ref$color = _ref.color,
    color = _ref$color === void 0 ? _Platform.default.OS === 'ios' ? GRAY : null : _ref$color,
    _ref$hidesWhenStopped = _ref.hidesWhenStopped,
    hidesWhenStopped = _ref$hidesWhenStopped === void 0 ? true : _ref$hidesWhenStopped,
    onLayout = _ref.onLayout,
    _ref$size = _ref.size,
    size = _ref$size === void 0 ? 'small' : _ref$size,
    style = _ref.style,
    restProps = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var sizeStyle;
  var sizeProp;
  switch (size) {
    case 'small':
      sizeStyle = styles.sizeSmall;
      sizeProp = 'small';
      break;
    case 'large':
      sizeStyle = styles.sizeLarge;
      sizeProp = 'large';
      break;
    default:
      sizeStyle = {
        height: size,
        width: size
      };
      break;
  }
  var nativeProps = Object.assign({
    animating: animating,
    color: color,
    hidesWhenStopped: hidesWhenStopped
  }, restProps, {
    ref: forwardedRef,
    style: sizeStyle,
    size: sizeProp
  });
  var androidProps = {
    styleAttr: 'Normal',
    indeterminate: true
  };
  return (0, _jsxRuntime.jsx)(_View.default, {
    onLayout: onLayout,
    style: _StyleSheet.default.compose(styles.container, style),
    children: _Platform.default.OS === 'android' ? (0, _jsxRuntime.jsx)(PlatformActivityIndicator, Object.assign({}, nativeProps, androidProps)) : (0, _jsxRuntime.jsx)(PlatformActivityIndicator, Object.assign({}, nativeProps))
  });
};
var ActivityIndicatorWithRef = React.forwardRef(ActivityIndicator);
ActivityIndicatorWithRef.displayName = 'ActivityIndicator';
var styles = _StyleSheet.default.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  sizeSmall: {
    width: 20,
    height: 20
  },
  sizeLarge: {
    width: 36,
    height: 36
  }
});
var _default = ActivityIndicatorWithRef;
exports.default = _default;
//# sourceMappingURL=ActivityIndicator.js.map