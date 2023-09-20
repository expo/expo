var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.__INTERNAL_VIEW_CONFIG = exports.Commands = void 0;
var NativeComponentRegistry = _interopRequireWildcard(require("../../NativeComponent/NativeComponentRegistry"));
var _codegenNativeCommands = _interopRequireDefault(require("../../Utilities/codegenNativeCommands"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var Commands = (0, _codegenNativeCommands.default)({
  supportedCommands: ['focus', 'blur', 'setTextAndSelection']
});
exports.Commands = Commands;
var __INTERNAL_VIEW_CONFIG = {
  uiViewClassName: 'AndroidTextInput',
  bubblingEventTypes: {
    topBlur: {
      phasedRegistrationNames: {
        bubbled: 'onBlur',
        captured: 'onBlurCapture'
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
    topTextInput: {
      phasedRegistrationNames: {
        bubbled: 'onTextInput',
        captured: 'onTextInputCapture'
      }
    }
  },
  directEventTypes: {
    topScroll: {
      registrationName: 'onScroll'
    }
  },
  validAttributes: {
    maxFontSizeMultiplier: true,
    adjustsFontSizeToFit: true,
    minimumFontScale: true,
    autoFocus: true,
    placeholder: true,
    inlineImagePadding: true,
    contextMenuHidden: true,
    textShadowColor: {
      process: require("../../StyleSheet/processColor").default
    },
    maxLength: true,
    selectTextOnFocus: true,
    textShadowRadius: true,
    underlineColorAndroid: {
      process: require("../../StyleSheet/processColor").default
    },
    textDecorationLine: true,
    submitBehavior: true,
    textAlignVertical: true,
    fontStyle: true,
    textShadowOffset: true,
    selectionColor: {
      process: require("../../StyleSheet/processColor").default
    },
    placeholderTextColor: {
      process: require("../../StyleSheet/processColor").default
    },
    importantForAutofill: true,
    lineHeight: true,
    textTransform: true,
    returnKeyType: true,
    keyboardType: true,
    multiline: true,
    color: {
      process: require("../../StyleSheet/processColor").default
    },
    autoComplete: true,
    numberOfLines: true,
    letterSpacing: true,
    returnKeyLabel: true,
    fontSize: true,
    onKeyPress: true,
    cursorColor: {
      process: require("../../StyleSheet/processColor").default
    },
    text: true,
    showSoftInputOnFocus: true,
    textAlign: true,
    autoCapitalize: true,
    autoCorrect: true,
    caretHidden: true,
    secureTextEntry: true,
    textBreakStrategy: true,
    onScroll: true,
    onContentSizeChange: true,
    disableFullscreenUI: true,
    includeFontPadding: true,
    fontWeight: true,
    fontFamily: true,
    allowFontScaling: true,
    onSelectionChange: true,
    mostRecentEventCount: true,
    inlineImageLeft: true,
    editable: true,
    fontVariant: true,
    borderBottomRightRadius: true,
    borderBottomColor: {
      process: require("../../StyleSheet/processColor").default
    },
    borderRadius: true,
    borderRightColor: {
      process: require("../../StyleSheet/processColor").default
    },
    borderColor: {
      process: require("../../StyleSheet/processColor").default
    },
    borderTopRightRadius: true,
    borderStyle: true,
    borderBottomLeftRadius: true,
    borderLeftColor: {
      process: require("../../StyleSheet/processColor").default
    },
    borderTopLeftRadius: true,
    borderTopColor: {
      process: require("../../StyleSheet/processColor").default
    }
  }
};
exports.__INTERNAL_VIEW_CONFIG = __INTERNAL_VIEW_CONFIG;
var AndroidTextInputNativeComponent = NativeComponentRegistry.get('AndroidTextInput', function () {
  return __INTERNAL_VIEW_CONFIG;
});
var _default = AndroidTextInputNativeComponent;
exports.default = _default;
//# sourceMappingURL=AndroidTextInputNativeComponent.js.map