var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SafeAreaInsetsContext = exports.SafeAreaFrameContext = exports.SafeAreaContext = exports.SafeAreaConsumer = void 0;
exports.SafeAreaProvider = SafeAreaProvider;
exports.useSafeArea = useSafeArea;
exports.useSafeAreaFrame = useSafeAreaFrame;
exports.useSafeAreaInsets = useSafeAreaInsets;
exports.withSafeAreaInsets = withSafeAreaInsets;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _NativeSafeAreaProvider = require("./NativeSafeAreaProvider");
var _excluded = ["children", "initialMetrics", "initialSafeAreaInsets", "style"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var isDev = process.env.NODE_ENV !== 'production';
var SafeAreaInsetsContext = React.createContext(null);
exports.SafeAreaInsetsContext = SafeAreaInsetsContext;
if (isDev) {
  SafeAreaInsetsContext.displayName = 'SafeAreaInsetsContext';
}
var SafeAreaFrameContext = React.createContext(null);
exports.SafeAreaFrameContext = SafeAreaFrameContext;
if (isDev) {
  SafeAreaFrameContext.displayName = 'SafeAreaFrameContext';
}
function SafeAreaProvider(_ref) {
  var _ref2, _ref3, _ref4, _ref5, _ref6;
  var children = _ref.children,
    initialMetrics = _ref.initialMetrics,
    initialSafeAreaInsets = _ref.initialSafeAreaInsets,
    style = _ref.style,
    others = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var parentInsets = useParentSafeAreaInsets();
  var parentFrame = useParentSafeAreaFrame();
  var _React$useState = React.useState((_ref2 = (_ref3 = (_ref4 = initialMetrics === null || initialMetrics === void 0 ? void 0 : initialMetrics.insets) != null ? _ref4 : initialSafeAreaInsets) != null ? _ref3 : parentInsets) != null ? _ref2 : null),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    insets = _React$useState2[0],
    setInsets = _React$useState2[1];
  var _React$useState3 = React.useState((_ref5 = (_ref6 = initialMetrics === null || initialMetrics === void 0 ? void 0 : initialMetrics.frame) != null ? _ref6 : parentFrame) != null ? _ref5 : {
      x: 0,
      y: 0,
      width: _reactNative.Dimensions.get('window').width,
      height: _reactNative.Dimensions.get('window').height
    }),
    _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
    frame = _React$useState4[0],
    setFrame = _React$useState4[1];
  var onInsetsChange = React.useCallback(function (event) {
    var _event$nativeEvent = event.nativeEvent,
      nextFrame = _event$nativeEvent.frame,
      nextInsets = _event$nativeEvent.insets;
    if (nextFrame && (nextFrame.height !== frame.height || nextFrame.width !== frame.width || nextFrame.x !== frame.x || nextFrame.y !== frame.y)) {
      setFrame(nextFrame);
    }
    if (!insets || nextInsets.bottom !== insets.bottom || nextInsets.left !== insets.left || nextInsets.right !== insets.right || nextInsets.top !== insets.top) {
      setInsets(nextInsets);
    }
  }, [frame, insets]);
  return React.createElement(_NativeSafeAreaProvider.NativeSafeAreaProvider, _extends({
    style: [styles.fill, style],
    onInsetsChange: onInsetsChange
  }, others), insets != null ? React.createElement(SafeAreaFrameContext.Provider, {
    value: frame
  }, React.createElement(SafeAreaInsetsContext.Provider, {
    value: insets
  }, children)) : null);
}
var styles = _reactNative.StyleSheet.create({
  fill: {
    flex: 1
  }
});
function useParentSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext);
}
function useParentSafeAreaFrame() {
  return React.useContext(SafeAreaFrameContext);
}
var NO_INSETS_ERROR = 'No safe area value available. Make sure you are rendering `<SafeAreaProvider>` at the top of your app.';
function useSafeAreaInsets() {
  var insets = React.useContext(SafeAreaInsetsContext);
  if (insets == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return insets;
}
function useSafeAreaFrame() {
  var frame = React.useContext(SafeAreaFrameContext);
  if (frame == null) {
    throw new Error(NO_INSETS_ERROR);
  }
  return frame;
}
function withSafeAreaInsets(WrappedComponent) {
  return React.forwardRef(function (props, ref) {
    var insets = useSafeAreaInsets();
    return React.createElement(WrappedComponent, _extends({}, props, {
      insets: insets,
      ref: ref
    }));
  });
}
function useSafeArea() {
  return useSafeAreaInsets();
}
var SafeAreaConsumer = SafeAreaInsetsContext.Consumer;
exports.SafeAreaConsumer = SafeAreaConsumer;
var SafeAreaContext = SafeAreaInsetsContext;
exports.SafeAreaContext = SafeAreaContext;