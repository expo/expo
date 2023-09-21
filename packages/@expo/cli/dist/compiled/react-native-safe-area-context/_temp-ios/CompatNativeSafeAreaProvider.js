Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompatNativeSafeAreaProvider = CompatNativeSafeAreaProvider;
var React = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function CompatNativeSafeAreaProvider(_ref) {
  var children = _ref.children,
    style = _ref.style,
    onInsetsChange = _ref.onInsetsChange;
  var window = (0, _reactNative.useWindowDimensions)();
  React.useEffect(function () {
    var insets = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
    var frame = {
      x: 0,
      y: 0,
      width: window.width,
      height: window.height
    };
    onInsetsChange({
      nativeEvent: {
        insets: insets,
        frame: frame
      }
    });
  }, [onInsetsChange, window.height, window.width]);
  return React.createElement(_reactNative.View, {
    style: style
  }, children);
}