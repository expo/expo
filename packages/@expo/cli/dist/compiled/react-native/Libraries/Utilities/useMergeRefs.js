Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useMergeRefs;
var _react = require("react");
function useMergeRefs() {
  for (var _len = arguments.length, refs = new Array(_len), _key = 0; _key < _len; _key++) {
    refs[_key] = arguments[_key];
  }
  return (0, _react.useCallback)(function (current) {
    for (var ref of refs) {
      if (ref != null) {
        if (typeof ref === 'function') {
          ref(current);
        } else {
          ref.current = current;
        }
      }
    }
  }, [].concat(refs));
}