var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ReactNativeStyleAttributes = _interopRequireDefault(require("../Components/View/ReactNativeStyleAttributes"));
var _ViewConfigIgnore = require("./ViewConfigIgnore");
var bubblingEventTypes = {
  topPress: {
    phasedRegistrationNames: {
      bubbled: 'onPress',
      captured: 'onPressCapture'
    }
  },
  topChange: {
    phasedRegistrationNames: {
      bubbled: 'onChange',
      captured: 'onChangeCapture'
    }
  },
  topFocus: {
    phasedRegistrationNames: {
      bubbled: 'onFocus',
      captured: 'onFocusCapture'
    }
  },
  topBlur: {
    phasedRegistrationNames: {
      bubbled: 'onBlur',
      captured: 'onBlurCapture'
    }
  },
  topSubmitEditing: {
    phasedRegistrationNames: {
      bubbled: 'onSubmitEditing',
      captured: 'onSubmitEditingCapture'
    }
  },
  topEndEditing: {
    phasedRegistrationNames: {
      bubbled: 'onEndEditing',
      captured: 'onEndEditingCapture'
    }
  },
  topKeyPress: {
    phasedRegistrationNames: {
      bubbled: 'onKeyPress',
      captured: 'onKeyPressCapture'
    }
  },
  topTouchStart: {
    phasedRegistrationNames: {
      bubbled: 'onTouchStart',
      captured: 'onTouchStartCapture'
    }
  },
  topTouchMove: {
    phasedRegistrationNames: {
      bubbled: 'onTouchMove',
      captured: 'onTouchMoveCapture'
    }
  },
  topTouchCancel: {
    phasedRegistrationNames: {
      bubbled: 'onTouchCancel',
      captured: 'onTouchCancelCapture'
    }
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      bubbled: 'onTouchEnd',
      captured: 'onTouchEndCapture'
    }
  },
  topPointerCancel: {
    phasedRegistrationNames: {
      captured: 'onPointerCancelCapture',
      bubbled: 'onPointerCancel'
    }
  },
  topPointerDown: {
    phasedRegistrationNames: {
      captured: 'onPointerDownCapture',
      bubbled: 'onPointerDown'
    }
  },
  topPointerMove: {
    phasedRegistrationNames: {
      captured: 'onPointerMoveCapture',
      bubbled: 'onPointerMove'
    }
  },
  topPointerUp: {
    phasedRegistrationNames: {
      captured: 'onPointerUpCapture',
      bubbled: 'onPointerUp'
    }
  },
  topPointerEnter: {
    phasedRegistrationNames: {
      captured: 'onPointerEnterCapture',
      bubbled: 'onPointerEnter',
      skipBubbling: true
    }
  },
  topPointerLeave: {
    phasedRegistrationNames: {
      captured: 'onPointerLeaveCapture',
      bubbled: 'onPointerLeave',
      skipBubbling: true
    }
  },
  topPointerOver: {
    phasedRegistrationNames: {
      captured: 'onPointerOverCapture',
      bubbled: 'onPointerOver'
    }
  },
  topPointerOut: {
    phasedRegistrationNames: {
      captured: 'onPointerOutCapture',
      bubbled: 'onPointerOut'
    }
  }
};
var directEventTypes = {
  topAccessibilityAction: {
    registrationName: 'onAccessibilityAction'
  },
  topAccessibilityTap: {
    registrationName: 'onAccessibilityTap'
  },
  topMagicTap: {
    registrationName: 'onMagicTap'
  },
  topAccessibilityEscape: {
    registrationName: 'onAccessibilityEscape'
  },
  topLayout: {
    registrationName: 'onLayout'
  },
  onGestureHandlerEvent: (0, _ViewConfigIgnore.DynamicallyInjectedByGestureHandler)({
    registrationName: 'onGestureHandlerEvent'
  }),
  onGestureHandlerStateChange: (0, _ViewConfigIgnore.DynamicallyInjectedByGestureHandler)({
    registrationName: 'onGestureHandlerStateChange'
  })
};
var validAttributesForNonEventProps = {
  accessible: true,
  accessibilityActions: true,
  accessibilityLabel: true,
  accessibilityHint: true,
  accessibilityLanguage: true,
  accessibilityValue: true,
  accessibilityViewIsModal: true,
  accessibilityElementsHidden: true,
  accessibilityIgnoresInvertColors: true,
  testID: true,
  backgroundColor: {
    process: require('../StyleSheet/processColor').default
  },
  backfaceVisibility: true,
  opacity: true,
  shadowColor: {
    process: require('../StyleSheet/processColor').default
  },
  shadowOffset: {
    diff: require('../Utilities/differ/sizesDiffer')
  },
  shadowOpacity: true,
  shadowRadius: true,
  needsOffscreenAlphaCompositing: true,
  overflow: true,
  shouldRasterizeIOS: true,
  transform: {
    diff: require('../Utilities/differ/matricesDiffer')
  },
  accessibilityRole: true,
  accessibilityState: true,
  nativeID: true,
  pointerEvents: true,
  removeClippedSubviews: true,
  borderRadius: true,
  borderColor: {
    process: require('../StyleSheet/processColor').default
  },
  borderCurve: true,
  borderWidth: true,
  borderStyle: true,
  hitSlop: {
    diff: require('../Utilities/differ/insetsDiffer')
  },
  collapsable: true,
  borderTopWidth: true,
  borderTopColor: {
    process: require('../StyleSheet/processColor').default
  },
  borderRightWidth: true,
  borderRightColor: {
    process: require('../StyleSheet/processColor').default
  },
  borderBottomWidth: true,
  borderBottomColor: {
    process: require('../StyleSheet/processColor').default
  },
  borderLeftWidth: true,
  borderLeftColor: {
    process: require('../StyleSheet/processColor').default
  },
  borderStartWidth: true,
  borderStartColor: {
    process: require('../StyleSheet/processColor').default
  },
  borderEndWidth: true,
  borderEndColor: {
    process: require('../StyleSheet/processColor').default
  },
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderTopStartRadius: true,
  borderTopEndRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderBottomStartRadius: true,
  borderBottomEndRadius: true,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  display: true,
  zIndex: true,
  top: true,
  right: true,
  start: true,
  end: true,
  bottom: true,
  left: true,
  width: true,
  height: true,
  minWidth: true,
  maxWidth: true,
  minHeight: true,
  maxHeight: true,
  margin: true,
  marginBlock: true,
  marginBlockEnd: true,
  marginBlockStart: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginInline: true,
  marginInlineEnd: true,
  marginInlineStart: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,
  padding: true,
  paddingBlock: true,
  paddingBlockEnd: true,
  paddingBlockStart: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingInline: true,
  paddingInlineEnd: true,
  paddingInlineStart: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,
  flex: true,
  flexGrow: true,
  rowGap: true,
  columnGap: true,
  gap: true,
  flexShrink: true,
  flexBasis: true,
  flexDirection: true,
  flexWrap: true,
  justifyContent: true,
  alignItems: true,
  alignSelf: true,
  alignContent: true,
  position: true,
  aspectRatio: true,
  direction: true,
  style: _ReactNativeStyleAttributes.default
};
var validAttributesForEventProps = (0, _ViewConfigIgnore.ConditionallyIgnoredEventHandlers)({
  onLayout: true,
  onMagicTap: true,
  onAccessibilityAction: true,
  onAccessibilityEscape: true,
  onAccessibilityTap: true,
  onMoveShouldSetResponder: true,
  onMoveShouldSetResponderCapture: true,
  onStartShouldSetResponder: true,
  onStartShouldSetResponderCapture: true,
  onResponderGrant: true,
  onResponderReject: true,
  onResponderStart: true,
  onResponderEnd: true,
  onResponderRelease: true,
  onResponderMove: true,
  onResponderTerminate: true,
  onResponderTerminationRequest: true,
  onShouldBlockNativeResponder: true,
  onTouchStart: true,
  onTouchMove: true,
  onTouchEnd: true,
  onTouchCancel: true,
  onPointerUp: true,
  onPointerDown: true,
  onPointerCancel: true,
  onPointerEnter: true,
  onPointerMove: true,
  onPointerLeave: true,
  onPointerOver: true,
  onPointerOut: true
});
var PlatformBaseViewConfigIos = {
  bubblingEventTypes: bubblingEventTypes,
  directEventTypes: directEventTypes,
  validAttributes: Object.assign({}, validAttributesForNonEventProps, validAttributesForEventProps)
};
var _default = PlatformBaseViewConfigIos;
exports.default = _default;
//# sourceMappingURL=BaseViewConfig.ios.js.map