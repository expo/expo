var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _UIManager = _interopRequireDefault(require("../../ReactNative/UIManager"));
function legacySendAccessibilityEvent(reactTag, eventType) {
  if (eventType === 'focus') {
    _UIManager.default.sendAccessibilityEvent(reactTag, _UIManager.default.getConstants().AccessibilityEventTypes.typeViewFocused);
  }
  if (eventType === 'click') {
    _UIManager.default.sendAccessibilityEvent(reactTag, _UIManager.default.getConstants().AccessibilityEventTypes.typeViewClicked);
  }
}
module.exports = legacySendAccessibilityEvent;