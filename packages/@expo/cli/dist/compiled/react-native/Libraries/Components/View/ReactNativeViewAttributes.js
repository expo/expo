'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _ReactNativeStyleAttributes = _interopRequireDefault(require("./ReactNativeStyleAttributes"));
var UIView = {
  pointerEvents: true,
  accessible: true,
  accessibilityActions: true,
  accessibilityLabel: true,
  accessibilityLiveRegion: true,
  accessibilityRole: true,
  accessibilityState: true,
  accessibilityValue: true,
  accessibilityHint: true,
  accessibilityLanguage: true,
  importantForAccessibility: true,
  nativeID: true,
  testID: true,
  renderToHardwareTextureAndroid: true,
  shouldRasterizeIOS: true,
  onLayout: true,
  onAccessibilityAction: true,
  onAccessibilityTap: true,
  onMagicTap: true,
  onAccessibilityEscape: true,
  collapsable: true,
  needsOffscreenAlphaCompositing: true,
  style: _ReactNativeStyleAttributes.default
};
var RCTView = Object.assign({}, UIView, {
  removeClippedSubviews: true
});
var ReactNativeViewAttributes = {
  UIView: UIView,
  RCTView: RCTView
};
module.exports = ReactNativeViewAttributes;
//# sourceMappingURL=ReactNativeViewAttributes.js.map