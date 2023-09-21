var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SafeAreaView = void 0;
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _SafeAreaContext = require("./SafeAreaContext");
var _excluded = ["style", "mode", "edges"];
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
var TOP = 8,
  RIGHT = 4,
  BOTTOM = 2,
  LEFT = 1,
  ALL = 15;
var edgeBitmaskMap = {
  top: TOP,
  right: RIGHT,
  bottom: BOTTOM,
  left: LEFT
};
var SafeAreaView = React.forwardRef(function (_ref, ref) {
  var _ref$style = _ref.style,
    style = _ref$style === void 0 ? {} : _ref$style,
    mode = _ref.mode,
    edges = _ref.edges,
    rest = (0, _objectWithoutProperties2.default)(_ref, _excluded);
  var insets = (0, _SafeAreaContext.useSafeAreaInsets)();
  var edgeBitmask = edges != null ? Array.isArray(edges) ? edges.reduce(function (acc, edge) {
    return acc | edgeBitmaskMap[edge];
  }, 0) : Object.keys(edges).reduce(function (acc, edge) {
    return acc | edgeBitmaskMap[edge];
  }, 0) : ALL;
  var appliedStyle = React.useMemo(function () {
    var insetTop = edgeBitmask & TOP ? insets.top : 0;
    var insetRight = edgeBitmask & RIGHT ? insets.right : 0;
    var insetBottom = edgeBitmask & BOTTOM ? insets.bottom : 0;
    var insetLeft = edgeBitmask & LEFT ? insets.left : 0;
    var flatStyle = _reactNative.StyleSheet.flatten(style);
    if (mode === 'margin') {
      var _flatStyle$margin = flatStyle.margin,
        margin = _flatStyle$margin === void 0 ? 0 : _flatStyle$margin,
        _flatStyle$marginVert = flatStyle.marginVertical,
        marginVertical = _flatStyle$marginVert === void 0 ? margin : _flatStyle$marginVert,
        _flatStyle$marginHori = flatStyle.marginHorizontal,
        marginHorizontal = _flatStyle$marginHori === void 0 ? margin : _flatStyle$marginHori,
        _flatStyle$marginTop = flatStyle.marginTop,
        marginTop = _flatStyle$marginTop === void 0 ? marginVertical : _flatStyle$marginTop,
        _flatStyle$marginRigh = flatStyle.marginRight,
        marginRight = _flatStyle$marginRigh === void 0 ? marginHorizontal : _flatStyle$marginRigh,
        _flatStyle$marginBott = flatStyle.marginBottom,
        marginBottom = _flatStyle$marginBott === void 0 ? marginVertical : _flatStyle$marginBott,
        _flatStyle$marginLeft = flatStyle.marginLeft,
        marginLeft = _flatStyle$marginLeft === void 0 ? marginHorizontal : _flatStyle$marginLeft;
      var marginStyle = {
        marginTop: marginTop + insetTop,
        marginRight: marginRight + insetRight,
        marginBottom: marginBottom + insetBottom,
        marginLeft: marginLeft + insetLeft
      };
      return [style, marginStyle];
    } else {
      var _flatStyle$padding = flatStyle.padding,
        padding = _flatStyle$padding === void 0 ? 0 : _flatStyle$padding,
        _flatStyle$paddingVer = flatStyle.paddingVertical,
        paddingVertical = _flatStyle$paddingVer === void 0 ? padding : _flatStyle$paddingVer,
        _flatStyle$paddingHor = flatStyle.paddingHorizontal,
        paddingHorizontal = _flatStyle$paddingHor === void 0 ? padding : _flatStyle$paddingHor,
        _flatStyle$paddingTop = flatStyle.paddingTop,
        paddingTop = _flatStyle$paddingTop === void 0 ? paddingVertical : _flatStyle$paddingTop,
        _flatStyle$paddingRig = flatStyle.paddingRight,
        paddingRight = _flatStyle$paddingRig === void 0 ? paddingHorizontal : _flatStyle$paddingRig,
        _flatStyle$paddingBot = flatStyle.paddingBottom,
        paddingBottom = _flatStyle$paddingBot === void 0 ? paddingVertical : _flatStyle$paddingBot,
        _flatStyle$paddingLef = flatStyle.paddingLeft,
        paddingLeft = _flatStyle$paddingLef === void 0 ? paddingHorizontal : _flatStyle$paddingLef;
      var paddingStyle = {
        paddingTop: paddingTop + insetTop,
        paddingRight: paddingRight + insetRight,
        paddingBottom: paddingBottom + insetBottom,
        paddingLeft: paddingLeft + insetLeft
      };
      return [style, paddingStyle];
    }
  }, [style, insets, mode, edgeBitmask]);
  return React.createElement(_reactNative.View, _extends({
    style: appliedStyle
  }, rest, {
    ref: ref
  }));
});
exports.SafeAreaView = SafeAreaView;