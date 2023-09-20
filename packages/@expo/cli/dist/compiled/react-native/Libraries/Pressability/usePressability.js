var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = usePressability;
var _Pressability = _interopRequireDefault(require("./Pressability"));
var _react = require("react");
function usePressability(config) {
  var pressabilityRef = (0, _react.useRef)(null);
  if (config != null && pressabilityRef.current == null) {
    pressabilityRef.current = new _Pressability.default(config);
  }
  var pressability = pressabilityRef.current;
  (0, _react.useEffect)(function () {
    if (config != null && pressability != null) {
      pressability.configure(config);
    }
  }, [config, pressability]);
  (0, _react.useEffect)(function () {
    if (pressability != null) {
      return function () {
        pressability.reset();
      };
    }
  }, [pressability]);
  return pressability == null ? null : pressability.getEventHandlers();
}
//# sourceMappingURL=usePressability.js.map