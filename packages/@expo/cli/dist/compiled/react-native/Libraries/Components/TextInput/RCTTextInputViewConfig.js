var _ViewConfigIgnore = require("../../NativeComponent/ViewConfigIgnore");
var RCTTextInputViewConfig = {
  bubblingEventTypes: {
    topBlur: {
      phasedRegistrationNames: {
        bubbled: 'onBlur',
        captured: 'onBlurCapture'
      }
    },
    topChange: {
      phasedRegistrationNames: {
        bubbled: 'onChange',
        captured: 'onChangeCapture'
      }
    },
    topContentSizeChange: {
      phasedRegistrationNames: {
        captured: 'onContentSizeChangeCapture',
        bubbled: 'onContentSizeChange'
      }
    },
    topEndEditing: {
      phasedRegistrationNames: {
        bubbled: 'onEndEditing',
        captured: 'onEndEditingCapture'
      }
    },
    topFocus: {
      phasedRegistrationNames: {
        bubbled: 'onFocus',
        captured: 'onFocusCapture'
      }
    },
    topKeyPress: {
      phasedRegistrationNames: {
        bubbled: 'onKeyPress',
        captured: 'onKeyPressCapture'
      }
    },
    topSubmitEditing: {
      phasedRegistrationNames: {
        bubbled: 'onSubmitEditing',
        captured: 'onSubmitEditingCapture'
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
    topTouchMove: {
      phasedRegistrationNames: {
        bubbled: 'onTouchMove',
        captured: 'onTouchMoveCapture'
      }
    }
  },
  directEventTypes: {
    topTextInput: {
      registrationName: 'onTextInput'
    },
    topKeyPressSync: {
      registrationName: 'onKeyPressSync'
    },
    topScroll: {
      registrationName: 'onScroll'
    },
    topSelectionChange: {
      registrationName: 'onSelectionChange'
    },
    topChangeSync: {
      registrationName: 'onChangeSync'
    }
  },
  validAttributes: Object.assign({
    fontSize: true,
    fontWeight: true,
    fontVariant: true,
    textShadowOffset: {
      diff: require('../../Utilities/differ/sizesDiffer')
    },
    allowFontScaling: true,
    fontStyle: true,
    textTransform: true,
    textAlign: true,
    fontFamily: true,
    lineHeight: true,
    isHighlighted: true,
    writingDirection: true,
    textDecorationLine: true,
    textShadowRadius: true,
    letterSpacing: true,
    textDecorationStyle: true,
    textDecorationColor: {
      process: require('../../StyleSheet/processColor').default
    },
    color: {
      process: require('../../StyleSheet/processColor').default
    },
    maxFontSizeMultiplier: true,
    textShadowColor: {
      process: require('../../StyleSheet/processColor').default
    },
    editable: true,
    inputAccessoryViewID: true,
    caretHidden: true,
    enablesReturnKeyAutomatically: true,
    placeholderTextColor: {
      process: require('../../StyleSheet/processColor').default
    },
    clearButtonMode: true,
    keyboardType: true,
    selection: true,
    returnKeyType: true,
    submitBehavior: true,
    mostRecentEventCount: true,
    scrollEnabled: true,
    selectionColor: {
      process: require('../../StyleSheet/processColor').default
    },
    contextMenuHidden: true,
    secureTextEntry: true,
    placeholder: true,
    autoCorrect: true,
    multiline: true,
    textContentType: true,
    maxLength: true,
    autoCapitalize: true,
    keyboardAppearance: true,
    passwordRules: true,
    spellCheck: true,
    selectTextOnFocus: true,
    text: true,
    clearTextOnFocus: true,
    showSoftInputOnFocus: true,
    autoFocus: true,
    lineBreakStrategyIOS: true
  }, (0, _ViewConfigIgnore.ConditionallyIgnoredEventHandlers)({
    onChange: true,
    onSelectionChange: true,
    onContentSizeChange: true,
    onScroll: true,
    onChangeSync: true,
    onKeyPressSync: true,
    onTextInput: true
  }))
};
module.exports = RCTTextInputViewConfig;
//# sourceMappingURL=RCTTextInputViewConfig.js.map