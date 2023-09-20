var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _RefreshControl = _interopRequireDefault(require("../../Components/RefreshControl/RefreshControl"));
var _ScrollView = _interopRequireDefault(require("../../Components/ScrollView/ScrollView"));
var _flattenStyle = _interopRequireDefault(require("../../StyleSheet/flattenStyle"));
var _splitLayoutProps2 = _interopRequireDefault(require("../../StyleSheet/splitLayoutProps"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _useMergeRefs = _interopRequireDefault(require("../../Utilities/useMergeRefs"));
var _createAnimatedComponent = _interopRequireDefault(require("../createAnimatedComponent"));
var _useAnimatedProps5 = _interopRequireDefault(require("../useAnimatedProps"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var AnimatedScrollView = React.forwardRef(function (props, forwardedRef) {
  if (_Platform.default.OS === 'android' && props.refreshControl != null && props.style != null) {
    return (0, _jsxRuntime.jsx)(AnimatedScrollViewWithInvertedRefreshControl, Object.assign({
      scrollEventThrottle: 0.0001
    }, props, {
      ref: forwardedRef,
      refreshControl: props.refreshControl
    }));
  } else {
    return (0, _jsxRuntime.jsx)(AnimatedScrollViewWithoutInvertedRefreshControl, Object.assign({
      scrollEventThrottle: 0.0001
    }, props, {
      ref: forwardedRef
    }));
  }
});
var AnimatedScrollViewWithInvertedRefreshControl = React.forwardRef(function (props, forwardedRef) {
  var _useMemo = (0, React.useMemo)(function () {
      var _splitLayoutProps = (0, _splitLayoutProps2.default)((0, _flattenStyle.default)(props.style)),
        outer = _splitLayoutProps.outer,
        inner = _splitLayoutProps.inner;
      return {
        intermediatePropsForRefreshControl: {
          style: outer
        },
        intermediatePropsForScrollView: Object.assign({}, props, {
          style: inner
        })
      };
    }, [props]),
    intermediatePropsForRefreshControl = _useMemo.intermediatePropsForRefreshControl,
    intermediatePropsForScrollView = _useMemo.intermediatePropsForScrollView;
  var _useAnimatedProps = (0, _useAnimatedProps5.default)(intermediatePropsForRefreshControl),
    _useAnimatedProps2 = (0, _slicedToArray2.default)(_useAnimatedProps, 2),
    refreshControlAnimatedProps = _useAnimatedProps2[0],
    refreshControlRef = _useAnimatedProps2[1];
  var refreshControl = React.cloneElement(props.refreshControl, Object.assign({}, refreshControlAnimatedProps, {
    ref: refreshControlRef
  }));
  var _useAnimatedProps3 = (0, _useAnimatedProps5.default)(intermediatePropsForScrollView),
    _useAnimatedProps4 = (0, _slicedToArray2.default)(_useAnimatedProps3, 2),
    scrollViewAnimatedProps = _useAnimatedProps4[0],
    scrollViewRef = _useAnimatedProps4[1];
  var ref = (0, _useMergeRefs.default)(scrollViewRef, forwardedRef);
  return (0, _jsxRuntime.jsx)(_ScrollView.default, Object.assign({}, scrollViewAnimatedProps, {
    ref: ref,
    refreshControl: refreshControl,
    style: _StyleSheet.default.compose(scrollViewAnimatedProps.style, refreshControlAnimatedProps.style)
  }));
});
var AnimatedScrollViewWithoutInvertedRefreshControl = (0, _createAnimatedComponent.default)(_ScrollView.default);
var _default = AnimatedScrollView;
exports.default = _default;
//# sourceMappingURL=AnimatedScrollView.js.map