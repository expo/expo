var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _NativeAccessibilityManager = _interopRequireDefault(require("./NativeAccessibilityManager"));
function legacySendAccessibilityEvent(reactTag, eventType) {
  if (eventType === 'focus' && _NativeAccessibilityManager.default) {
    _NativeAccessibilityManager.default.setAccessibilityFocus(reactTag);
  }
}
module.exports = legacySendAccessibilityEvent;