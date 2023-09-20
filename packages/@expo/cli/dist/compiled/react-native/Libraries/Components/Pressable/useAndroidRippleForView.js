var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useAndroidRippleForView;
var _processColor = _interopRequireDefault(require("../../StyleSheet/processColor"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _View = _interopRequireDefault(require("../View/View"));
var _ViewNativeComponent = require("../View/ViewNativeComponent");
var _invariant = _interopRequireDefault(require("invariant"));
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function useAndroidRippleForView(rippleConfig, viewRef) {
  var _ref = rippleConfig != null ? rippleConfig : {},
    color = _ref.color,
    borderless = _ref.borderless,
    radius = _ref.radius,
    foreground = _ref.foreground;
  return (0, React.useMemo)(function () {
    if (_Platform.default.OS === 'android' && _Platform.default.Version >= 21 && (color != null || borderless != null || radius != null)) {
      var processedColor = (0, _processColor.default)(color);
      (0, _invariant.default)(processedColor == null || typeof processedColor === 'number', 'Unexpected color given for Ripple color');
      var nativeRippleValue = {
        type: 'RippleAndroid',
        color: processedColor,
        borderless: borderless === true,
        rippleRadius: radius
      };
      return {
        viewProps: foreground === true ? {
          nativeForegroundAndroid: nativeRippleValue
        } : {
          nativeBackgroundAndroid: nativeRippleValue
        },
        onPressIn: function onPressIn(event) {
          var view = viewRef.current;
          if (view != null) {
            var _event$nativeEvent$lo, _event$nativeEvent$lo2;
            _ViewNativeComponent.Commands.hotspotUpdate(view, (_event$nativeEvent$lo = event.nativeEvent.locationX) != null ? _event$nativeEvent$lo : 0, (_event$nativeEvent$lo2 = event.nativeEvent.locationY) != null ? _event$nativeEvent$lo2 : 0);
            _ViewNativeComponent.Commands.setPressed(view, true);
          }
        },
        onPressMove: function onPressMove(event) {
          var view = viewRef.current;
          if (view != null) {
            var _event$nativeEvent$lo3, _event$nativeEvent$lo4;
            _ViewNativeComponent.Commands.hotspotUpdate(view, (_event$nativeEvent$lo3 = event.nativeEvent.locationX) != null ? _event$nativeEvent$lo3 : 0, (_event$nativeEvent$lo4 = event.nativeEvent.locationY) != null ? _event$nativeEvent$lo4 : 0);
          }
        },
        onPressOut: function onPressOut(event) {
          var view = viewRef.current;
          if (view != null) {
            _ViewNativeComponent.Commands.setPressed(view, false);
          }
        }
      };
    }
    return null;
  }, [borderless, color, foreground, radius, viewRef]);
}
//# sourceMappingURL=useAndroidRippleForView.js.map