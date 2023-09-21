var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ReactNativeStyleAttributes = _interopRequireDefault(require("../Components/View/ReactNativeStyleAttributes"));
var _ViewConfigIgnore = require("./ViewConfigIgnore");
var bubblingEventTypes = {
  topChange: {
    phasedRegistrationNames: {
      captured: 'onChangeCapture',
      bubbled: 'onChange'
    }
  },
  topSelect: {
    phasedRegistrationNames: {
      captured: 'onSelectCapture',
      bubbled: 'onSelect'
    }
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      captured: 'onTouchEndCapture',
      bubbled: 'onTouchEnd'
    }
  },
  topTouchCancel: {
    phasedRegistrationNames: {
      captured: 'onTouchCancelCapture',
      bubbled: 'onTouchCancel'
    }
  },
  topTouchStart: {
    phasedRegistrationNames: {
      captured: 'onTouchStartCapture',
      bubbled: 'onTouchStart'
    }
  },
  topTouchMove: {
    phasedRegistrationNames: {
      captured: 'onTouchMoveCapture',
      bubbled: 'onTouchMove'
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
  topPointerOut: {
    phasedRegistrationNames: {
      captured: 'onPointerOutCapture',
      bubbled: 'onPointerOut'
    }
  },
  topPointerOver: {
    phasedRegistrationNames: {
      captured: 'onPointerOverCapture',
      bubbled: 'onPointerOver'
    }
  }
};
var directEventTypes = {
  topAccessibilityAction: {
    registrationName: 'onAccessibilityAction'
  },
  onGestureHandlerEvent: (0, _ViewConfigIgnore.DynamicallyInjectedByGestureHandler)({
    registrationName: 'onGestureHandlerEvent'
  }),
  onGestureHandlerStateChange: (0, _ViewConfigIgnore.DynamicallyInjectedByGestureHandler)({
    registrationName: 'onGestureHandlerStateChange'
  }),
  topContentSizeChange: {
    registrationName: 'onContentSizeChange'
  },
  topScrollBeginDrag: {
    registrationName: 'onScrollBeginDrag'
  },
  topMessage: {
    registrationName: 'onMessage'
  },
  topSelectionChange: {
    registrationName: 'onSelectionChange'
  },
  topLoadingFinish: {
    registrationName: 'onLoadingFinish'
  },
  topMomentumScrollEnd: {
    registrationName: 'onMomentumScrollEnd'
  },
  topClick: {
    registrationName: 'onClick'
  },
  topLoadingStart: {
    registrationName: 'onLoadingStart'
  },
  topLoadingError: {
    registrationName: 'onLoadingError'
  },
  topMomentumScrollBegin: {
    registrationName: 'onMomentumScrollBegin'
  },
  topScrollEndDrag: {
    registrationName: 'onScrollEndDrag'
  },
  topScroll: {
    registrationName: 'onScroll'
  },
  topLayout: {
    registrationName: 'onLayout'
  }
};
var validAttributesForNonEventProps = {
  backgroundColor: {
    process: require('../StyleSheet/processColor').default
  },
  transform: true,
  opacity: true,
  elevation: true,
  shadowColor: {
    process: require('../StyleSheet/processColor').default
  },
  zIndex: true,
  renderToHardwareTextureAndroid: true,
  testID: true,
  nativeID: true,
  accessibilityLabelledBy: true,
  accessibilityLabel: true,
  accessibilityHint: true,
  accessibilityRole: true,
  accessibilityCollection: true,
  accessibilityCollectionItem: true,
  accessibilityState: true,
  accessibilityActions: true,
  accessibilityValue: true,
  importantForAccessibility: true,
  rotation: true,
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,
  accessibilityLiveRegion: true,
  width: true,
  minWidth: true,
  collapsable: true,
  maxWidth: true,
  height: true,
  minHeight: true,
  maxHeight: true,
  flex: true,
  flexGrow: true,
  rowGap: true,
  columnGap: true,
  gap: true,
  flexShrink: true,
  flexBasis: true,
  aspectRatio: true,
  flexDirection: true,
  flexWrap: true,
  alignSelf: true,
  alignItems: true,
  alignContent: true,
  justifyContent: true,
  overflow: true,
  display: true,
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
  borderWidth: true,
  borderStartWidth: true,
  borderEndWidth: true,
  borderTopWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,
  start: true,
  end: true,
  left: true,
  right: true,
  top: true,
  bottom: true,
  position: true,
  style: _ReactNativeStyleAttributes.default
};
var validAttributesForEventProps = {
  onLayout: true,
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
  onPointerEnter: true,
  onPointerEnterCapture: true,
  onPointerLeave: true,
  onPointerLeaveCapture: true,
  onPointerMove: true,
  onPointerMoveCapture: true,
  onPointerOut: true,
  onPointerOutCapture: true,
  onPointerOver: true,
  onPointerOverCapture: true
};
var PlatformBaseViewConfigAndroid = {
  directEventTypes: directEventTypes,
  bubblingEventTypes: bubblingEventTypes,
  validAttributes: Object.assign({}, validAttributesForNonEventProps, validAttributesForEventProps)
};
var _default = PlatformBaseViewConfigAndroid;
exports.default = _default;