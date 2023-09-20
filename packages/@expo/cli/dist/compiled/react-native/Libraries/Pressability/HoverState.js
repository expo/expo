var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isHoverEnabled = isHoverEnabled;
var _Platform = _interopRequireDefault(require("../Utilities/Platform"));
var isEnabled = false;
if (_Platform.default.OS === 'web') {
  var canUseDOM = Boolean(typeof window !== 'undefined' && window.document && window.document.createElement);
  if (canUseDOM) {
    var HOVER_THRESHOLD_MS = 1000;
    var lastTouchTimestamp = 0;
    var enableHover = function enableHover() {
      if (isEnabled || Date.now() - lastTouchTimestamp < HOVER_THRESHOLD_MS) {
        return;
      }
      isEnabled = true;
    };
    var disableHover = function disableHover() {
      lastTouchTimestamp = Date.now();
      if (isEnabled) {
        isEnabled = false;
      }
    };
    document.addEventListener('touchstart', disableHover, true);
    document.addEventListener('touchmove', disableHover, true);
    document.addEventListener('mousemove', enableHover, true);
  }
}
function isHoverEnabled() {
  return isEnabled;
}
//# sourceMappingURL=HoverState.js.map