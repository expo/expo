Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useRefEffect;
var _react = require("react");
function useRefEffect(effect) {
  var cleanupRef = (0, _react.useRef)(undefined);
  return (0, _react.useCallback)(function (instance) {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = undefined;
    }
    if (instance != null) {
      cleanupRef.current = effect(instance);
    }
  }, [effect]);
}