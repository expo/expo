/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 32:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var normalizeColor = __nccwpck_require__(370);
var colorPropType = function colorPropType(isRequired, props, propName, componentName, location, propFullName) {
  var color = props[propName];
  if (color == null) {
    if (isRequired) {
      return new Error('Required ' + location + ' `' + (propFullName || propName) + '` was not specified in `' + componentName + '`.');
    }
    return;
  }
  if (typeof color === 'number') {
    return;
  }
  if (typeof color === 'string' && normalizeColor(color) === null) {
    return new Error('Invalid ' + location + ' `' + (propFullName || propName) + '` supplied to `' + componentName + '`: ' + color + '\n' + `Valid color formats are
  - '#f0f' (#rgb)
  - '#f0fc' (#rgba)
  - '#ff00ff' (#rrggbb)
  - '#ff00ff00' (#rrggbbaa)
  - 'rgb(255, 255, 255)'
  - 'rgba(255, 255, 255, 1.0)'
  - 'hsl(360, 100%, 100%)'
  - 'hsla(360, 100%, 100%, 1.0)'
  - 'transparent'
  - 'red'
  - 0xff00ff00 (0xrrggbbaa)
`);
  }
};
var ColorPropType = colorPropType.bind(null, false);
ColorPropType.isRequired = colorPropType.bind(null, true);
module.exports = ColorPropType;

/***/ }),

/***/ 208:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var PropTypes = __nccwpck_require__(900);
var DeprecatedEdgeInsetsPropType = PropTypes.shape({
  bottom: PropTypes.number,
  left: PropTypes.number,
  right: PropTypes.number,
  top: PropTypes.number
});
module.exports = DeprecatedEdgeInsetsPropType;

/***/ }),

/***/ 237:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedColorPropType = __nccwpck_require__(32);
var DeprecatedEdgeInsetsPropType = __nccwpck_require__(208);
var DeprecatedImageSourcePropType = __nccwpck_require__(165);
var DeprecatedImageStylePropTypes = __nccwpck_require__(353);
var DeprecatedStyleSheetPropType = __nccwpck_require__(882);
var DeprecatedViewPropTypes = __nccwpck_require__(360);
var PropTypes = __nccwpck_require__(900);
var DeprecatedImagePropType = Object.assign({}, DeprecatedViewPropTypes, {
  alt: PropTypes.string,
  blurRadius: PropTypes.number,
  capInsets: DeprecatedEdgeInsetsPropType,
  crossOrigin: PropTypes.oneOf(['anonymous', 'use-credentials']),
  defaultSource: DeprecatedImageSourcePropType,
  fadeDuration: PropTypes.number,
  height: PropTypes.number,
  internal_analyticTag: PropTypes.string,
  loadingIndicatorSource: PropTypes.oneOfType([PropTypes.shape({
    uri: PropTypes.string
  }), PropTypes.number]),
  onError: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadEnd: PropTypes.func,
  onLoadStart: PropTypes.func,
  onPartialLoad: PropTypes.func,
  onProgress: PropTypes.func,
  progressiveRenderingEnabled: PropTypes.bool,
  referrerPolicy: PropTypes.oneOf(['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin', 'unsafe-url']),
  resizeMethod: PropTypes.oneOf(['auto', 'resize', 'scale']),
  resizeMode: PropTypes.oneOf(['cover', 'contain', 'stretch', 'repeat', 'center']),
  source: DeprecatedImageSourcePropType,
  src: PropTypes.string,
  srcSet: PropTypes.string,
  style: DeprecatedStyleSheetPropType(DeprecatedImageStylePropTypes),
  testID: PropTypes.string,
  tintColor: DeprecatedColorPropType,
  width: PropTypes.number
});
module.exports = DeprecatedImagePropType;

/***/ }),

/***/ 165:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var PropTypes = __nccwpck_require__(900);
var ImageURISourcePropType = PropTypes.shape({
  body: PropTypes.string,
  bundle: PropTypes.string,
  cache: PropTypes.oneOf(['default', 'force-cache', 'only-if-cached', 'reload']),
  headers: PropTypes.objectOf(PropTypes.string),
  height: PropTypes.number,
  method: PropTypes.string,
  scale: PropTypes.number,
  uri: PropTypes.string,
  width: PropTypes.number
});
var ImageSourcePropType = PropTypes.oneOfType([ImageURISourcePropType, PropTypes.number, PropTypes.arrayOf(ImageURISourcePropType)]);
module.exports = ImageSourcePropType;

/***/ }),

/***/ 353:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedColorPropType = __nccwpck_require__(32);
var DeprecatedLayoutPropTypes = __nccwpck_require__(428);
var DeprecatedShadowPropTypesIOS = __nccwpck_require__(583);
var DeprecatedTransformPropTypes = __nccwpck_require__(576);
var PropTypes = __nccwpck_require__(900);
var DeprecatedImageStylePropTypes = Object.assign({}, DeprecatedLayoutPropTypes, DeprecatedShadowPropTypesIOS, DeprecatedTransformPropTypes, {
  backfaceVisibility: PropTypes.oneOf(['hidden', 'visible']),
  backgroundColor: DeprecatedColorPropType,
  borderBottomLeftRadius: PropTypes.number,
  borderBottomRightRadius: PropTypes.number,
  borderColor: DeprecatedColorPropType,
  borderRadius: PropTypes.number,
  borderTopLeftRadius: PropTypes.number,
  borderTopRightRadius: PropTypes.number,
  borderWidth: PropTypes.number,
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'scale-down']),
  opacity: PropTypes.number,
  overflow: PropTypes.oneOf(['hidden', 'visible']),
  overlayColor: PropTypes.string,
  tintColor: DeprecatedColorPropType,
  resizeMode: PropTypes.oneOf(['center', 'contain', 'cover', 'repeat', 'stretch'])
});
module.exports = DeprecatedImageStylePropTypes;

/***/ }),

/***/ 428:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var PropTypes = __nccwpck_require__(900);
var DimensionValuePropType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);
var DeprecatedLayoutPropTypes = {
  alignContent: PropTypes.oneOf(['center', 'flex-end', 'flex-start', 'space-around', 'space-between', 'stretch']),
  alignItems: PropTypes.oneOf(['baseline', 'center', 'flex-end', 'flex-start', 'stretch']),
  alignSelf: PropTypes.oneOf(['auto', 'baseline', 'center', 'flex-end', 'flex-start', 'stretch']),
  aspectRatio: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  borderBottomWidth: PropTypes.number,
  borderEndWidth: PropTypes.number,
  borderLeftWidth: PropTypes.number,
  borderRightWidth: PropTypes.number,
  borderStartWidth: PropTypes.number,
  borderTopWidth: PropTypes.number,
  borderWidth: PropTypes.number,
  bottom: DimensionValuePropType,
  columnGap: PropTypes.number,
  direction: PropTypes.oneOf(['inherit', 'ltr', 'rtl']),
  display: PropTypes.oneOf(['flex', 'none']),
  end: DimensionValuePropType,
  flex: PropTypes.number,
  flexBasis: DimensionValuePropType,
  flexDirection: PropTypes.oneOf(['column', 'column-reverse', 'row', 'row-reverse']),
  flexGrow: PropTypes.number,
  flexShrink: PropTypes.number,
  flexWrap: PropTypes.oneOf(['nowrap', 'wrap', 'wrap-reverse']),
  gap: PropTypes.number,
  height: DimensionValuePropType,
  inset: DimensionValuePropType,
  insetBlock: DimensionValuePropType,
  insetBlockEnd: DimensionValuePropType,
  insetBlockStart: DimensionValuePropType,
  insetInline: DimensionValuePropType,
  insetInlineEnd: DimensionValuePropType,
  insetInlineStart: DimensionValuePropType,
  justifyContent: PropTypes.oneOf(['center', 'flex-end', 'flex-start', 'space-around', 'space-between', 'space-evenly']),
  left: DimensionValuePropType,
  margin: DimensionValuePropType,
  marginBlock: DimensionValuePropType,
  marginBlockEnd: DimensionValuePropType,
  marginBlockStart: DimensionValuePropType,
  marginBottom: DimensionValuePropType,
  marginEnd: DimensionValuePropType,
  marginHorizontal: DimensionValuePropType,
  marginInline: DimensionValuePropType,
  marginInlineEnd: DimensionValuePropType,
  marginInlineStart: DimensionValuePropType,
  marginLeft: DimensionValuePropType,
  marginRight: DimensionValuePropType,
  marginStart: DimensionValuePropType,
  marginTop: DimensionValuePropType,
  marginVertical: DimensionValuePropType,
  maxHeight: DimensionValuePropType,
  maxWidth: DimensionValuePropType,
  minHeight: DimensionValuePropType,
  minWidth: DimensionValuePropType,
  overflow: PropTypes.oneOf(['hidden', 'scroll', 'visible']),
  padding: DimensionValuePropType,
  paddingBlock: DimensionValuePropType,
  paddingBlockEnd: DimensionValuePropType,
  paddingBlockStart: DimensionValuePropType,
  paddingBottom: DimensionValuePropType,
  paddingEnd: DimensionValuePropType,
  paddingHorizontal: DimensionValuePropType,
  paddingInline: DimensionValuePropType,
  paddingInlineEnd: DimensionValuePropType,
  paddingInlineStart: DimensionValuePropType,
  paddingLeft: DimensionValuePropType,
  paddingRight: DimensionValuePropType,
  paddingStart: DimensionValuePropType,
  paddingTop: DimensionValuePropType,
  paddingVertical: DimensionValuePropType,
  position: PropTypes.oneOf(['absolute', 'relative']),
  right: DimensionValuePropType,
  rowGap: PropTypes.number,
  start: DimensionValuePropType,
  top: DimensionValuePropType,
  width: DimensionValuePropType,
  zIndex: PropTypes.number
};
module.exports = DeprecatedLayoutPropTypes;

/***/ }),

/***/ 737:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var PropTypes = __nccwpck_require__(900);
var PointPropType = PropTypes.shape({
  x: PropTypes.number,
  y: PropTypes.number
});
module.exports = PointPropType;

/***/ }),

/***/ 583:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedColorPropType = __nccwpck_require__(32);
var PropTypes = __nccwpck_require__(900);
var DeprecatedShadowPropTypesIOS = {
  shadowColor: DeprecatedColorPropType,
  shadowOffset: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number
  }),
  shadowOpacity: PropTypes.number,
  shadowRadius: PropTypes.number
};
module.exports = DeprecatedShadowPropTypesIOS;

/***/ }),

/***/ 882:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var deprecatedCreateStrictShapeTypeChecker = __nccwpck_require__(333);
function DeprecatedStyleSheetPropType(shape) {
  var shapePropType = deprecatedCreateStrictShapeTypeChecker(shape);
  return function (props, propName, componentName, location) {
    var newProps = props;
    if (props[propName]) {
      newProps = {};
      newProps[propName] = flattenStyle(props[propName]);
    }
    for (var _len = arguments.length, rest = new Array(_len > 4 ? _len - 4 : 0), _key = 4; _key < _len; _key++) {
      rest[_key - 4] = arguments[_key];
    }
    return shapePropType.apply(void 0, [newProps, propName, componentName, location].concat(rest));
  };
}
function flattenStyle(style) {
  if (style === null || typeof style !== 'object') {
    return undefined;
  }
  if (!Array.isArray(style)) {
    return style;
  }
  var result = {};
  for (var i = 0, styleLength = style.length; i < styleLength; ++i) {
    var computedStyle = flattenStyle(style[i]);
    if (computedStyle) {
      for (var key in computedStyle) {
        result[key] = computedStyle[key];
      }
    }
  }
  return result;
}
module.exports = DeprecatedStyleSheetPropType;

/***/ }),

/***/ 409:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedColorPropType = __nccwpck_require__(32);
var DeprecatedTextPropTypes = __nccwpck_require__(996);
var DeprecatedViewPropTypes = __nccwpck_require__(360);
var PropTypes = __nccwpck_require__(900);
var DataDetectorTypes = ['address', 'all', 'calendarEvent', 'link', 'none', 'phoneNumber'];
var DeprecatedTextInputPropTypes = Object.assign({}, DeprecatedViewPropTypes, {
  allowFontScaling: PropTypes.bool,
  autoCapitalize: PropTypes.oneOf(['none', 'sentences', 'words', 'characters']),
  autoComplete: PropTypes.oneOf(['additional-name', 'address-line1', 'address-line2', 'bday', 'bday-day', 'bday-month', 'bday-year', 'birthdate-day', 'birthdate-full', 'birthdate-month', 'birthdate-year', 'cc-csc', 'cc-exp', 'cc-exp-day', 'cc-exp-month', 'cc-exp-year', 'cc-number', 'country', 'current-password', 'email', 'family-name', 'gender', 'given-name', 'honorific-prefix', 'honorific-suffix', 'name', 'name-family', 'name-given', 'name-middle', 'name-middle-initial', 'name-prefix', 'name-suffix', 'new-password', 'nickname', 'off', 'one-time-code', 'organization', 'organization-title', 'password', 'password-new', 'postal-address', 'postal-address-country', 'postal-address-extended', 'postal-address-extended-postal-code', 'postal-address-locality', 'postal-address-region', 'postal-code', 'sex', 'sms-otp', 'street-address', 'tel', 'tel-country-code', 'tel-device', 'tel-national', 'url', 'username', 'username-new']),
  autoCorrect: PropTypes.bool,
  autoFocus: PropTypes.bool,
  blurOnSubmit: PropTypes.bool,
  caretHidden: PropTypes.bool,
  clearButtonMode: PropTypes.oneOf(['always', 'never', 'unless-editing', 'while-editing']),
  clearTextOnFocus: PropTypes.bool,
  cursorColor: DeprecatedColorPropType,
  contextMenuHidden: PropTypes.bool,
  dataDetectorTypes: PropTypes.oneOfType([PropTypes.oneOf(DataDetectorTypes), PropTypes.arrayOf(PropTypes.oneOf(DataDetectorTypes))]),
  defaultValue: PropTypes.string,
  disableFullscreenUI: PropTypes.bool,
  editable: PropTypes.bool,
  enablesReturnKeyAutomatically: PropTypes.bool,
  enterKeyHint: PropTypes.oneOf(['done', 'enter', 'go', 'next', 'previous', 'search', 'send']),
  inlineImageLeft: PropTypes.string,
  inlineImagePadding: PropTypes.number,
  inputAccessoryViewID: PropTypes.string,
  inputMode: PropTypes.oneOf(['decimal', 'email', 'none', 'numeric', 'search', 'tel', 'text', 'url']),
  keyboardAppearance: PropTypes.oneOf(['default', 'dark', 'light']),
  keyboardType: PropTypes.oneOf(['ascii-capable', 'ascii-capable-number-pad', 'decimal-pad', 'default', 'email-address', 'name-phone-pad', 'number-pad', 'numbers-and-punctuation', 'numeric', 'phone-pad', 'twitter', 'url', 'visible-password', 'web-search']),
  lineBreakStrategyIOS: PropTypes.oneOf(['hangul-word', 'none', 'push-out', 'standard']),
  maxFontSizeMultiplier: PropTypes.number,
  maxLength: PropTypes.number,
  multiline: PropTypes.bool,
  numberOfLines: PropTypes.number,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onChangeText: PropTypes.func,
  onContentSizeChange: PropTypes.func,
  onEndEditing: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyPress: PropTypes.func,
  onLayout: PropTypes.func,
  onScroll: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onSubmitEditing: PropTypes.func,
  onTextInput: PropTypes.func,
  placeholder: PropTypes.string,
  placeholderTextColor: DeprecatedColorPropType,
  readOnly: PropTypes.bool,
  rejectResponderTermination: PropTypes.bool,
  returnKeyLabel: PropTypes.string,
  returnKeyType: PropTypes.oneOf(['default', 'done', 'emergency-call', 'go', 'google', 'join', 'next', 'none', 'previous', 'route', 'search', 'send', 'yahoo']),
  rows: PropTypes.number,
  scrollEnabled: PropTypes.bool,
  secureTextEntry: PropTypes.bool,
  selection: PropTypes.shape({
    end: PropTypes.number,
    start: PropTypes.number.isRequired
  }),
  selectionColor: DeprecatedColorPropType,
  selectTextOnFocus: PropTypes.bool,
  showSoftInputOnFocus: PropTypes.bool,
  spellCheck: PropTypes.bool,
  style: DeprecatedTextPropTypes.style,
  submitBehavior: PropTypes.oneOf(['blurAndSubmit', 'newline', 'submit']),
  textBreakStrategy: PropTypes.oneOf(['balanced', 'highQuality', 'simple']),
  textContentType: PropTypes.oneOf(['addressCity', 'addressCityAndState', 'addressState', 'countryName', 'creditCardNumber', 'emailAddress', 'familyName', 'fullStreetAddress', 'givenName', 'jobTitle', 'location', 'middleName', 'name', 'namePrefix', 'nameSuffix', 'newPassword', 'nickname', 'none', 'oneTimeCode', 'organizationName', 'password', 'postalCode', 'streetAddressLine1', 'streetAddressLine2', 'sublocality', 'telephoneNumber', 'URL', 'username']),
  underlineColorAndroid: DeprecatedColorPropType,
  value: PropTypes.string
});
module.exports = DeprecatedTextInputPropTypes;

/***/ }),

/***/ 996:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedColorPropType = __nccwpck_require__(32);
var DeprecatedEdgeInsetsPropType = __nccwpck_require__(208);
var DeprecatedStyleSheetPropType = __nccwpck_require__(882);
var DeprecatedTextStylePropTypes = __nccwpck_require__(375);
var _require = __nccwpck_require__(507),
  AccessibilityActionInfoPropType = _require.AccessibilityActionInfoPropType,
  AccessibilityRolePropType = _require.AccessibilityRolePropType,
  AccessibilityStatePropType = _require.AccessibilityStatePropType,
  AccessibilityValuePropType = _require.AccessibilityValuePropType,
  RolePropType = _require.RolePropType;
var PropTypes = __nccwpck_require__(900);
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

/***/ }),

/***/ 375:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedColorPropType = __nccwpck_require__(32);
var DeprecatedViewStylePropTypes = __nccwpck_require__(143);
var PropTypes = __nccwpck_require__(900);
var DeprecatedTextStylePropTypes = Object.assign({}, DeprecatedViewStylePropTypes, {
  color: DeprecatedColorPropType,
  fontFamily: PropTypes.string,
  fontSize: PropTypes.number,
  fontStyle: PropTypes.oneOf(['italic', 'normal']),
  fontVariant: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOf(['lining-nums', 'oldstyle-nums', 'proportional-nums', 'small-caps', 'stylistic-eight', 'stylistic-eighteen', 'stylistic-eleven', 'stylistic-fifteen', 'stylistic-five', 'stylistic-four', 'stylistic-fourteen', 'stylistic-nine', 'stylistic-nineteen', 'stylistic-one', 'stylistic-seven', 'stylistic-seventeen', 'stylistic-six', 'stylistic-sixteen', 'stylistic-ten', 'stylistic-thirteen', 'stylistic-three', 'stylistic-twelve', 'stylistic-twenty', 'stylistic-two', 'tabular-nums'])), PropTypes.string]),
  fontWeight: PropTypes.oneOf(['100', '200', '300', '400', '500', '600', '700', '800', '900', 'black', 'bold', 'condensed', 'condensedBold', 'heavy', 'light', 'medium', 'normal', 'regular', 'semibold', 'thin', 'ultralight', 100, 200, 300, 400, 500, 600, 700, 800, 900]),
  includeFontPadding: PropTypes.bool,
  letterSpacing: PropTypes.number,
  lineHeight: PropTypes.number,
  textAlign: PropTypes.oneOf(['auto', 'center', 'justify', 'left', 'right']),
  textAlignVertical: PropTypes.oneOf(['auto', 'bottom', 'center', 'top']),
  textDecorationColor: DeprecatedColorPropType,
  textDecorationLine: PropTypes.oneOf(['line-through', 'none', 'underline line-through', 'underline']),
  textDecorationStyle: PropTypes.oneOf(['dashed', 'dotted', 'double', 'solid']),
  textShadowColor: DeprecatedColorPropType,
  textShadowOffset: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number
  }),
  textShadowRadius: PropTypes.number,
  textTransform: PropTypes.oneOf(['capitalize', 'lowercase', 'none', 'uppercase']),
  userSelect: PropTypes.oneOf(['all', 'auto', 'contain', 'none', 'text']),
  verticalAlign: PropTypes.oneOf(['auto', 'bottom', 'middle', 'top']),
  writingDirection: PropTypes.oneOf(['auto', 'ltr', 'rtl'])
});
module.exports = DeprecatedTextStylePropTypes;

/***/ }),

/***/ 576:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var PropTypes = __nccwpck_require__(900);
var DeprecatedTransformPropTypes = {
  transform: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.shape({
    perspective: PropTypes.number
  }), PropTypes.shape({
    rotate: PropTypes.string
  }), PropTypes.shape({
    rotateX: PropTypes.string
  }), PropTypes.shape({
    rotateY: PropTypes.string
  }), PropTypes.shape({
    rotateZ: PropTypes.string
  }), PropTypes.shape({
    scale: PropTypes.number
  }), PropTypes.shape({
    scaleX: PropTypes.number
  }), PropTypes.shape({
    scaleY: PropTypes.number
  }), PropTypes.shape({
    skewX: PropTypes.string
  }), PropTypes.shape({
    skewY: PropTypes.string
  }), PropTypes.shape({
    translateX: PropTypes.number
  }), PropTypes.shape({
    translateY: PropTypes.number
  })]))
};
module.exports = DeprecatedTransformPropTypes;

/***/ }),

/***/ 507:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var PropTypes = __nccwpck_require__(900);
var DeprecatedViewAccessibility = {
  AccessibilityRolePropType: PropTypes.oneOf(['adjustable', 'alert', 'button', 'checkbox', 'combobox', 'drawerlayout', 'dropdownlist', 'grid', 'header', 'horizontalscrollview', 'iconmenu', 'image', 'imagebutton', 'keyboardkey', 'link', 'list', 'menu', 'menubar', 'menuitem', 'none', 'pager', 'progressbar', 'radio', 'radiogroup', 'scrollbar', 'scrollview', 'search', 'slidingdrawer', 'spinbutton', 'summary', 'switch', 'tab', 'tabbar', 'tablist', 'text', 'timer', 'togglebutton', 'toolbar', 'viewgroup', 'webview']),
  AccessibilityStatePropType: PropTypes.object,
  AccessibilityActionInfoPropType: PropTypes.object,
  AccessibilityValuePropType: PropTypes.object,
  RolePropType: PropTypes.oneOf(['alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'grid', 'group', 'heading', 'img', 'link', 'list', 'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem', 'meter', 'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'summary', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'])
};
module.exports = DeprecatedViewAccessibility;

/***/ }),

/***/ 360:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedEdgeInsetsPropType = __nccwpck_require__(208);
var DeprecatedStyleSheetPropType = __nccwpck_require__(882);
var _require = __nccwpck_require__(507),
  AccessibilityActionInfoPropType = _require.AccessibilityActionInfoPropType,
  AccessibilityRolePropType = _require.AccessibilityRolePropType,
  AccessibilityStatePropType = _require.AccessibilityStatePropType,
  AccessibilityValuePropType = _require.AccessibilityValuePropType,
  RolePropType = _require.RolePropType;
var DeprecatedViewStylePropTypes = __nccwpck_require__(143);
var PropTypes = __nccwpck_require__(900);
var MouseEventPropTypes = {
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func
};
var PointerEventPropTypes = {
  onPointerEnter: PropTypes.func,
  onPointerEnterCapture: PropTypes.func,
  onPointerLeave: PropTypes.func,
  onPointerLeaveCapture: PropTypes.func,
  onPointerMove: PropTypes.func,
  onPointerMoveCapture: PropTypes.func,
  onPointerCancel: PropTypes.func,
  onPointerCancelCapture: PropTypes.func,
  onPointerDown: PropTypes.func,
  onPointerDownCapture: PropTypes.func,
  onPointerUp: PropTypes.func,
  onPointerUpCapture: PropTypes.func,
  onPointerOver: PropTypes.func,
  onPointerOverCapture: PropTypes.func,
  onPointerOut: PropTypes.func,
  onPointerOutCapture: PropTypes.func
};
var FocusEventPropTypes = {
  onBlur: PropTypes.func,
  onBlurCapture: PropTypes.func,
  onFocus: PropTypes.func,
  onFocusCapture: PropTypes.func
};
var TouchEventPropTypes = {
  onTouchCancel: PropTypes.func,
  onTouchCancelCapture: PropTypes.func,
  onTouchEnd: PropTypes.func,
  onTouchEndCapture: PropTypes.func,
  onTouchMove: PropTypes.func,
  onTouchMoveCapture: PropTypes.func,
  onTouchStart: PropTypes.func,
  onTouchStartCapture: PropTypes.func
};
var GestureResponderEventPropTypes = {
  onMoveShouldSetResponder: PropTypes.func,
  onMoveShouldSetResponderCapture: PropTypes.func,
  onResponderEnd: PropTypes.func,
  onResponderGrant: PropTypes.func,
  onResponderMove: PropTypes.func,
  onResponderReject: PropTypes.func,
  onResponderRelease: PropTypes.func,
  onResponderStart: PropTypes.func,
  onResponderTerminate: PropTypes.func,
  onResponderTerminationRequest: PropTypes.func,
  onStartShouldSetResponder: PropTypes.func,
  onStartShouldSetResponderCapture: PropTypes.func
};
var DeprecatedViewPropTypes = Object.assign({}, MouseEventPropTypes, PointerEventPropTypes, FocusEventPropTypes, TouchEventPropTypes, GestureResponderEventPropTypes, {
  'aria-busy': PropTypes.bool,
  'aria-checked': PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['mixed'])]),
  'aria-disabled': PropTypes.bool,
  'aria-expanded': PropTypes.bool,
  'aria-hidden': PropTypes.bool,
  'aria-label': PropTypes.string,
  'aria-labelledby': PropTypes.string,
  'aria-live': PropTypes.oneOf(['polite', 'assertive', 'off']),
  'aria-modal': PropTypes.bool,
  'aria-selected': PropTypes.bool,
  'aria-valuemax': PropTypes.number,
  'aria-valuemin': PropTypes.number,
  'aria-valuenow': PropTypes.number,
  'aria-valuetext': PropTypes.string,
  accessibilityActions: PropTypes.arrayOf(AccessibilityActionInfoPropType),
  accessibilityElementsHidden: PropTypes.bool,
  accessibilityHint: PropTypes.string,
  accessibilityIgnoresInvertColors: PropTypes.bool,
  accessibilityLabel: PropTypes.node,
  accessibilityLabelledBy: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  accessibilityLanguage: PropTypes.string,
  accessibilityLiveRegion: PropTypes.oneOf(['assertive', 'none', 'polite']),
  accessibilityRole: AccessibilityRolePropType,
  accessibilityState: AccessibilityStatePropType,
  accessibilityValue: AccessibilityValuePropType,
  accessibilityViewIsModal: PropTypes.bool,
  accessible: PropTypes.bool,
  collapsable: PropTypes.bool,
  focusable: PropTypes.bool,
  hitSlop: PropTypes.oneOfType([DeprecatedEdgeInsetsPropType, PropTypes.number]),
  importantForAccessibility: PropTypes.oneOf(['auto', 'no', 'no-hide-descendants', 'yes']),
  nativeBackgroundAndroid: PropTypes.object,
  nativeForegroundAndroid: PropTypes.object,
  nativeID: PropTypes.string,
  needsOffscreenAlphaCompositing: PropTypes.bool,
  onAccessibilityAction: PropTypes.func,
  onAccessibilityEscape: PropTypes.func,
  onAccessibilityTap: PropTypes.func,
  onClick: PropTypes.func,
  onLayout: PropTypes.func,
  onMagicTap: PropTypes.func,
  pointerEvents: PropTypes.oneOf(['auto', 'box-none', 'box-only', 'none']),
  removeClippedSubviews: PropTypes.bool,
  renderToHardwareTextureAndroid: PropTypes.bool,
  role: RolePropType,
  shouldRasterizeIOS: PropTypes.bool,
  style: DeprecatedStyleSheetPropType(DeprecatedViewStylePropTypes),
  tabIndex: PropTypes.oneOf([0, -1]),
  testID: PropTypes.string
});
module.exports = DeprecatedViewPropTypes;

/***/ }),

/***/ 143:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var DeprecatedColorPropType = __nccwpck_require__(32);
var DeprecatedLayoutPropTypes = __nccwpck_require__(428);
var DeprecatedShadowPropTypesIOS = __nccwpck_require__(583);
var DeprecatedTransformPropTypes = __nccwpck_require__(576);
var PropTypes = __nccwpck_require__(900);
var DeprecatedViewStylePropTypes = Object.assign({}, DeprecatedLayoutPropTypes, DeprecatedShadowPropTypesIOS, DeprecatedTransformPropTypes, {
  backfaceVisibility: PropTypes.oneOf(['hidden', 'visible']),
  backgroundColor: DeprecatedColorPropType,
  borderBottomColor: DeprecatedColorPropType,
  borderBottomEndRadius: PropTypes.number,
  borderBottomLeftRadius: PropTypes.number,
  borderBottomRightRadius: PropTypes.number,
  borderBottomStartRadius: PropTypes.number,
  borderBottomWidth: PropTypes.number,
  borderColor: DeprecatedColorPropType,
  borderCurve: PropTypes.oneOf(['circular', 'continuous']),
  borderEndColor: DeprecatedColorPropType,
  borderEndEndRadius: PropTypes.number,
  borderEndStartRadius: PropTypes.number,
  borderLeftColor: DeprecatedColorPropType,
  borderLeftWidth: PropTypes.number,
  borderRadius: PropTypes.number,
  borderRightColor: DeprecatedColorPropType,
  borderRightWidth: PropTypes.number,
  borderStartColor: DeprecatedColorPropType,
  borderStartEndRadius: PropTypes.number,
  borderStartStartRadius: PropTypes.number,
  borderStyle: PropTypes.oneOf(['dashed', 'dotted', 'solid']),
  borderTopColor: DeprecatedColorPropType,
  borderTopEndRadius: PropTypes.number,
  borderTopLeftRadius: PropTypes.number,
  borderTopRightRadius: PropTypes.number,
  borderTopStartRadius: PropTypes.number,
  borderTopWidth: PropTypes.number,
  borderWidth: PropTypes.number,
  elevation: PropTypes.number,
  opacity: PropTypes.number,
  pointerEvents: PropTypes.oneOf(['auto', 'box-none', 'box-only', 'none'])
});
module.exports = DeprecatedViewStylePropTypes;

/***/ }),

/***/ 333:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



var invariant = __nccwpck_require__(251);
function deprecatedCreateStrictShapeTypeChecker(shapeTypes) {
  function checkType(isRequired, props, propName, componentName, location) {
    if (!props[propName]) {
      if (isRequired) {
        invariant(false, `Required object \`${propName}\` was not specified in ` + `\`${componentName}\`.`);
      }
      return;
    }
    var propValue = props[propName];
    var propType = typeof propValue;
    var locationName = location || '(unknown)';
    if (propType !== 'object') {
      invariant(false, `Invalid ${locationName} \`${propName}\` of type \`${propType}\` ` + `supplied to \`${componentName}\`, expected \`object\`.`);
    }
    var allKeys = Object.assign({}, props[propName], shapeTypes);
    for (var _len = arguments.length, rest = new Array(_len > 5 ? _len - 5 : 0), _key = 5; _key < _len; _key++) {
      rest[_key - 5] = arguments[_key];
    }
    for (var key in allKeys) {
      var checker = shapeTypes[key];
      if (!checker) {
        invariant(false, `Invalid props.${propName} key \`${key}\` supplied to \`${componentName}\`.` + '\nBad object: ' + JSON.stringify(props[propName], null, '  ') + '\nValid keys: ' + JSON.stringify(Object.keys(shapeTypes), null, '  '));
      }
      var error = checker.apply(void 0, [propValue, key, componentName, location].concat(rest));
      if (error) {
        invariant(false, error.message + '\nBad object: ' + JSON.stringify(props[propName], null, '  '));
      }
    }
  }
  function chainedCheckType(props, propName, componentName, location) {
    for (var _len2 = arguments.length, rest = new Array(_len2 > 4 ? _len2 - 4 : 0), _key2 = 4; _key2 < _len2; _key2++) {
      rest[_key2 - 4] = arguments[_key2];
    }
    return checkType.apply(void 0, [false, props, propName, componentName, location].concat(rest));
  }
  chainedCheckType.isRequired = checkType.bind(null, true);
  return chainedCheckType;
}
module.exports = deprecatedCreateStrictShapeTypeChecker;

/***/ }),

/***/ 692:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {



module.exports = {
  get ColorPropType() {
    return __nccwpck_require__(32);
  },
  get EdgeInsetsPropType() {
    return __nccwpck_require__(208);
  },
  get ImagePropTypes() {
    return __nccwpck_require__(237);
  },
  get PointPropType() {
    return __nccwpck_require__(737);
  },
  get TextInputPropTypes() {
    return __nccwpck_require__(409);
  },
  get TextPropTypes() {
    return __nccwpck_require__(996);
  },
  get ViewPropTypes() {
    return __nccwpck_require__(360);
  }
};

/***/ }),

/***/ 370:
/***/ (function(module) {

module.exports = require("@react-native/normalize-colors");

/***/ }),

/***/ 251:
/***/ (function(module) {

module.exports = require("invariant");

/***/ }),

/***/ 900:
/***/ (function(module) {

module.exports = require("prop-types");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = "" + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(692);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;