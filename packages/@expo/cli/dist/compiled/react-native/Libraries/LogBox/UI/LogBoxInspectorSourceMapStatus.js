var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _Animated = _interopRequireDefault(require("../../Animated/Animated"));
var _Easing = _interopRequireDefault(require("../../Animated/Easing"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _LogBoxButton = _interopRequireDefault(require("./LogBoxButton"));
var LogBoxStyle = _interopRequireWildcard(require("./LogBoxStyle"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function LogBoxInspectorSourceMapStatus(props) {
  var _React$useState = React.useState({
      animation: null,
      rotate: null
    }),
    _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
    state = _React$useState2[0],
    setState = _React$useState2[1];
  React.useEffect(function () {
    if (props.status === 'PENDING') {
      if (state.animation == null) {
        var animated = new _Animated.default.Value(0);
        var animation = _Animated.default.loop(_Animated.default.timing(animated, {
          duration: 2000,
          easing: _Easing.default.linear,
          toValue: 1,
          useNativeDriver: true
        }));
        setState({
          animation: animation,
          rotate: animated.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          })
        });
        animation.start();
      }
    } else {
      if (state.animation != null) {
        state.animation.stop();
        setState({
          animation: null,
          rotate: null
        });
      }
    }
    return function () {
      if (state.animation != null) {
        state.animation.stop();
      }
    };
  }, [props.status, state.animation]);
  var image;
  var color;
  switch (props.status) {
    case 'FAILED':
      image = require('./LogBoxImages/alert-triangle.png');
      color = LogBoxStyle.getErrorColor(1);
      break;
    case 'PENDING':
      image = require('./LogBoxImages/loader.png');
      color = LogBoxStyle.getWarningColor(1);
      break;
  }
  if (props.status === 'COMPLETE' || image == null) {
    return null;
  }
  return (0, _jsxRuntime.jsxs)(_LogBoxButton.default, {
    backgroundColor: {
      default: 'transparent',
      pressed: LogBoxStyle.getBackgroundColor(1)
    },
    hitSlop: {
      bottom: 8,
      left: 8,
      right: 8,
      top: 8
    },
    onPress: props.onPress,
    style: styles.root,
    children: [(0, _jsxRuntime.jsx)(_Animated.default.Image, {
      source: image,
      style: [styles.image, {
        tintColor: color
      }, state.rotate == null || props.status !== 'PENDING' ? null : {
        transform: [{
          rotate: state.rotate
        }]
      }]
    }), (0, _jsxRuntime.jsx)(_Text.default, {
      style: [styles.text, {
        color: color
      }],
      children: "Source Map"
    })]
  });
}
var styles = _StyleSheet.default.create({
  root: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 24,
    paddingHorizontal: 8
  },
  image: {
    height: 14,
    width: 16,
    marginEnd: 4,
    tintColor: LogBoxStyle.getTextColor(0.4)
  },
  text: {
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16
  }
});
var _default = LogBoxInspectorSourceMapStatus;
exports.default = _default;
//# sourceMappingURL=LogBoxInspectorSourceMapStatus.js.map