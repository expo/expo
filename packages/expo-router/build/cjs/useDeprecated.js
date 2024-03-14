"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useDeprecated = useDeprecated;
exports.useWarnOnce = useWarnOnce;
function _react() {
  const data = require("react");
  _react = function () {
    return data;
  };
  return data;
}
function _Platform() {
  const data = _interopRequireDefault(require("react-native-web/dist/exports/Platform"));
  _Platform = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Node environment may render in multiple processes causing the warning to log mutiple times
// Hence we skip the warning in these environments.
const canWarn = _Platform().default.select({
  native: process.env.NODE_ENV !== 'production',
  default: process.env.NODE_ENV !== 'production' && typeof window !== 'undefined'
});
const warned = new Set();
function useWarnOnce(message, guard = true, key = message) {
  // useLayoutEffect typically doesn't run in node environments.
  // Combined with skipWarn, this should prevent unwanted warnings
  (0, _react().useLayoutEffect)(() => {
    if (guard && canWarn && !warned.has(key)) {
      warned.add(key);
      console.warn(message);
    }
  }, [guard]);
}
function useDeprecated(message, guard = true, key = message) {
  return useWarnOnce(key, guard, `Expo Router: ${message}`);
}
//# sourceMappingURL=useDeprecated.js.map