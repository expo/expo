'use strict';

var DeprecatedColorPropType = require('./DeprecatedColorPropType');
var DeprecatedEdgeInsetsPropType = require('./DeprecatedEdgeInsetsPropType');
var DeprecatedStyleSheetPropType = require('./DeprecatedStyleSheetPropType');
var DeprecatedTextStylePropTypes = require('./DeprecatedTextStylePropTypes');
var _require = require('./DeprecatedViewAccessibility'),
  AccessibilityActionInfoPropType = _require.AccessibilityActionInfoPropType,
  AccessibilityRolePropType = _require.AccessibilityRolePropType,
  AccessibilityStatePropType = _require.AccessibilityStatePropType,
  AccessibilityValuePropType = _require.AccessibilityValuePropType,
  RolePropType = _require.RolePropType;
var PropTypes = require('prop-types');
var DeprecatedTextPropTypes = {
  'aria-busy': PropTypes.bool,
  'aria-checked': PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['mixed'])]),
  'aria-disabled': PropTypes.bool,
  'aria-expanded': PropTypes.bool,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  'aria-selected': PropTypes.bool,
  accessibilityActions: PropTypes.arrayOf(AccessibilityActionInfoPropType),
  accessibilityHint: PropTypes.string,
  accessibilityLabel: PropTypes.string,
  accessibilityLanguage: PropTypes.string,
  accessibilityRole: AccessibilityRolePropType,
  accessibilityState: AccessibilityStatePropType,
  accessible: PropTypes.bool,
  adjustsFontSizeToFit: PropTypes.bool,
  allowFontScaling: PropTypes.bool,
  dataDetectorType: PropTypes.oneOf(['all', 'email', 'link', 'none', 'phoneNumber']),
  disabled: PropTypes.bool,
  dynamicTypeRamp: PropTypes.oneOf(['body', 'callout', 'caption1', 'caption2', 'footnote', 'headline', 'largeTitle', 'subheadline', 'title1', 'title2', 'title3']),
  ellipsizeMode: PropTypes.oneOf(['clip', 'head', 'middle', 'tail']),
  id: PropTypes.string,
  lineBreakStrategyIOS: PropTypes.oneOf(['hangul-word', 'none', 'push-out', 'standard']),
  maxFontSizeMultiplier: PropTypes.number,
  minimumFontScale: PropTypes.number,
  nativeID: PropTypes.string,
  numberOfLines: PropTypes.number,
  onAccessibilityAction: PropTypes.func,
  onLayout: PropTypes.func,
  onLongPress: PropTypes.func,
  onMoveShouldSetResponder: PropTypes.func,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  onResponderGrant: PropTypes.func,
  onResponderMove: PropTypes.func,
  onResponderRelease: PropTypes.func,
  onResponderTerminate: PropTypes.func,
  onResponderTerminationRequest: PropTypes.func,
  onStartShouldSetResponder: PropTypes.func,
  onTextLayout: PropTypes.func,
  pressRetentionOffset: DeprecatedEdgeInsetsPropType,
  role: RolePropType,
  selectable: PropTypes.bool,
  selectionColor: DeprecatedColorPropType,
  style: DeprecatedStyleSheetPropType(DeprecatedTextStylePropTypes),
  suppressHighlighting: PropTypes.bool,
  testID: PropTypes.string,
  textBreakStrategy: PropTypes.oneOf(['balanced', 'highQuality', 'simple'])
};
module.exports = DeprecatedTextPropTypes;