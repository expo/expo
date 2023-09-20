var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useAnimatedValue;
var _Animated = _interopRequireDefault(require("./Animated"));
var _react = require("react");
function useAnimatedValue(initialValue, config) {
  var ref = (0, _react.useRef)(null);
  if (ref.current == null) {
    ref.current = new _Animated.default.Value(initialValue, config);
  }
  return ref.current;
}
//# sourceMappingURL=useAnimatedValue.js.map