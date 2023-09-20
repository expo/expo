var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _usePressability = _interopRequireDefault(require("../../Pressability/usePressability"));
var _flattenStyle = _interopRequireDefault(require("../../StyleSheet/flattenStyle"));
var _StyleSheet = _interopRequireDefault(require("../../StyleSheet/StyleSheet"));
var _Text = _interopRequireDefault(require("../../Text/Text"));
var _TextAncestor = _interopRequireDefault(require("../../Text/TextAncestor"));
var _Platform = _interopRequireDefault(require("../../Utilities/Platform"));
var _useMergeRefs = _interopRequireDefault(require("../../Utilities/useMergeRefs"));
var _TextInputState = _interopRequireDefault(require("./TextInputState"));
var _invariant = _interopRequireDefault(require("invariant"));
var _nullthrows = _interopRequireDefault(require("nullthrows"));
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
var _excluded = ["aria-busy", "aria-checked", "aria-disabled", "aria-expanded", "aria-selected", "accessibilityState", "id", "tabIndex", "selection"],
  _excluded2 = ["onBlur", "onFocus"],
  _excluded3 = ["allowFontScaling", "rejectResponderTermination", "underlineColorAndroid", "autoComplete", "textContentType", "readOnly", "editable", "enterKeyHint", "returnKeyType", "inputMode", "showSoftInputOnFocus", "keyboardType"];
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var AndroidTextInput;
var AndroidTextInputCommands;
var RCTSinglelineTextInputView;
var RCTSinglelineTextInputNativeCommands;
var RCTMultilineTextInputView;
var RCTMultilineTextInputNativeCommands;
if (_Platform.default.OS === 'android') {
  AndroidTextInput = require('./AndroidTextInputNativeComponent').default;
  AndroidTextInputCommands = require('./AndroidTextInputNativeComponent').Commands;
} else if (_Platform.default.OS === 'ios') {
  RCTSinglelineTextInputView = require('./RCTSingelineTextInputNativeComponent').default;
  RCTSinglelineTextInputNativeCommands = require('./RCTSingelineTextInputNativeComponent').Commands;
  RCTMultilineTextInputView = require('./RCTMultilineTextInputNativeComponent').default;
  RCTMultilineTextInputNativeCommands = require('./RCTMultilineTextInputNativeComponent').Commands;
}
var emptyFunctionThatReturnsTrue = function emptyFunctionThatReturnsTrue() {
  return true;
};
function InternalTextInput(props) {
  var _propsSelection$end, _props$multiline;
  var ariaBusy = props['aria-busy'],
    ariaChecked = props['aria-checked'],
    ariaDisabled = props['aria-disabled'],
    ariaExpanded = props['aria-expanded'],
    ariaSelected = props['aria-selected'],
    accessibilityState = props.accessibilityState,
    id = props.id,
    tabIndex = props.tabIndex,
    propsSelection = props.selection,
    otherProps = (0, _objectWithoutProperties2.default)(props, _excluded);
  var inputRef = (0, React.useRef)(null);
  var selection = propsSelection == null ? null : {
    start: propsSelection.start,
    end: (_propsSelection$end = propsSelection.end) != null ? _propsSelection$end : propsSelection.start
  };
  var _useState = (0, React.useState)(0),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    mostRecentEventCount = _useState2[0],
    setMostRecentEventCount = _useState2[1];
  var _useState3 = (0, React.useState)(props.value),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    lastNativeText = _useState4[0],
    setLastNativeText = _useState4[1];
  var _useState5 = (0, React.useState)({
      selection: selection,
      mostRecentEventCount: mostRecentEventCount
    }),
    _useState6 = (0, _slicedToArray2.default)(_useState5, 2),
    lastNativeSelectionState = _useState6[0],
    setLastNativeSelection = _useState6[1];
  var lastNativeSelection = lastNativeSelectionState.selection;
  var viewCommands;
  if (AndroidTextInputCommands) {
    viewCommands = AndroidTextInputCommands;
  } else {
    viewCommands = props.multiline === true ? RCTMultilineTextInputNativeCommands : RCTSinglelineTextInputNativeCommands;
  }
  var text = typeof props.value === 'string' ? props.value : typeof props.defaultValue === 'string' ? props.defaultValue : '';
  (0, React.useLayoutEffect)(function () {
    var nativeUpdate = {};
    if (lastNativeText !== props.value && typeof props.value === 'string') {
      nativeUpdate.text = props.value;
      setLastNativeText(props.value);
    }
    if (selection && lastNativeSelection && (lastNativeSelection.start !== selection.start || lastNativeSelection.end !== selection.end)) {
      nativeUpdate.selection = selection;
      setLastNativeSelection({
        selection: selection,
        mostRecentEventCount: mostRecentEventCount
      });
    }
    if (Object.keys(nativeUpdate).length === 0) {
      return;
    }
    if (inputRef.current != null) {
      var _selection$start, _selection$end;
      viewCommands.setTextAndSelection(inputRef.current, mostRecentEventCount, text, (_selection$start = selection == null ? void 0 : selection.start) != null ? _selection$start : -1, (_selection$end = selection == null ? void 0 : selection.end) != null ? _selection$end : -1);
    }
  }, [mostRecentEventCount, inputRef, props.value, props.defaultValue, lastNativeText, selection, lastNativeSelection, text, viewCommands]);
  (0, React.useLayoutEffect)(function () {
    var inputRefValue = inputRef.current;
    if (inputRefValue != null) {
      _TextInputState.default.registerInput(inputRefValue);
      return function () {
        _TextInputState.default.unregisterInput(inputRefValue);
        if (_TextInputState.default.currentlyFocusedInput() === inputRefValue) {
          (0, _nullthrows.default)(inputRefValue).blur();
        }
      };
    }
  }, [inputRef]);
  var setLocalRef = (0, React.useCallback)(function (instance) {
    inputRef.current = instance;
    if (instance != null) {
      Object.assign(instance, {
        clear: function clear() {
          if (inputRef.current != null) {
            viewCommands.setTextAndSelection(inputRef.current, mostRecentEventCount, '', 0, 0);
          }
        },
        isFocused: function isFocused() {
          return _TextInputState.default.currentlyFocusedInput() === inputRef.current;
        },
        getNativeRef: function getNativeRef() {
          return inputRef.current;
        },
        setSelection: function setSelection(start, end) {
          if (inputRef.current != null) {
            viewCommands.setTextAndSelection(inputRef.current, mostRecentEventCount, null, start, end);
          }
        }
      });
    }
  }, [mostRecentEventCount, viewCommands]);
  var ref = (0, _useMergeRefs.default)(setLocalRef, props.forwardedRef);
  var _onChange = function _onChange(event) {
    var currentText = event.nativeEvent.text;
    props.onChange && props.onChange(event);
    props.onChangeText && props.onChangeText(currentText);
    if (inputRef.current == null) {
      return;
    }
    setLastNativeText(currentText);
    setMostRecentEventCount(event.nativeEvent.eventCount);
  };
  var _onChangeSync = function _onChangeSync(event) {
    var currentText = event.nativeEvent.text;
    props.unstable_onChangeSync && props.unstable_onChangeSync(event);
    props.unstable_onChangeTextSync && props.unstable_onChangeTextSync(currentText);
    if (inputRef.current == null) {
      return;
    }
    setLastNativeText(currentText);
    setMostRecentEventCount(event.nativeEvent.eventCount);
  };
  var _onSelectionChange = function _onSelectionChange(event) {
    props.onSelectionChange && props.onSelectionChange(event);
    if (inputRef.current == null) {
      return;
    }
    setLastNativeSelection({
      selection: event.nativeEvent.selection,
      mostRecentEventCount: mostRecentEventCount
    });
  };
  var _onFocus = function _onFocus(event) {
    _TextInputState.default.focusInput(inputRef.current);
    if (props.onFocus) {
      props.onFocus(event);
    }
  };
  var _onBlur = function _onBlur(event) {
    _TextInputState.default.blurInput(inputRef.current);
    if (props.onBlur) {
      props.onBlur(event);
    }
  };
  var _onScroll = function _onScroll(event) {
    props.onScroll && props.onScroll(event);
  };
  var textInput = null;
  var multiline = (_props$multiline = props.multiline) != null ? _props$multiline : false;
  var submitBehavior;
  if (props.submitBehavior != null) {
    if (!multiline && props.submitBehavior === 'newline') {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = props.submitBehavior;
    }
  } else if (multiline) {
    if (props.blurOnSubmit === true) {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = 'newline';
    }
  } else {
    if (props.blurOnSubmit !== false) {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = 'submit';
    }
  }
  var accessible = props.accessible !== false;
  var focusable = props.focusable !== false;
  var config = React.useMemo(function () {
    return {
      hitSlop: props.hitSlop,
      onPress: function onPress(event) {
        if (props.editable !== false) {
          if (inputRef.current != null) {
            inputRef.current.focus();
          }
        }
      },
      onPressIn: props.onPressIn,
      onPressOut: props.onPressOut,
      cancelable: _Platform.default.OS === 'ios' ? !props.rejectResponderTermination : null
    };
  }, [props.editable, props.hitSlop, props.onPressIn, props.onPressOut, props.rejectResponderTermination]);
  var caretHidden = props.caretHidden;
  if (_Platform.default.isTesting) {
    caretHidden = true;
  }
  var _ref = (0, _usePressability.default)(config) || {},
    onBlur = _ref.onBlur,
    onFocus = _ref.onFocus,
    eventHandlers = (0, _objectWithoutProperties2.default)(_ref, _excluded2);
  var _accessibilityState;
  if (accessibilityState != null || ariaBusy != null || ariaChecked != null || ariaDisabled != null || ariaExpanded != null || ariaSelected != null) {
    _accessibilityState = {
      busy: ariaBusy != null ? ariaBusy : accessibilityState == null ? void 0 : accessibilityState.busy,
      checked: ariaChecked != null ? ariaChecked : accessibilityState == null ? void 0 : accessibilityState.checked,
      disabled: ariaDisabled != null ? ariaDisabled : accessibilityState == null ? void 0 : accessibilityState.disabled,
      expanded: ariaExpanded != null ? ariaExpanded : accessibilityState == null ? void 0 : accessibilityState.expanded,
      selected: ariaSelected != null ? ariaSelected : accessibilityState == null ? void 0 : accessibilityState.selected
    };
  }
  var style = (0, _flattenStyle.default)(props.style);
  if (_Platform.default.OS === 'ios') {
    var RCTTextInputView = props.multiline === true ? RCTMultilineTextInputView : RCTSinglelineTextInputView;
    style = props.multiline === true ? [styles.multilineInput, style] : style;
    var useOnChangeSync = (props.unstable_onChangeSync || props.unstable_onChangeTextSync) && !(props.onChange || props.onChangeText);
    textInput = (0, _jsxRuntime.jsx)(RCTTextInputView, Object.assign({
      ref: ref
    }, otherProps, eventHandlers, {
      accessibilityState: _accessibilityState,
      accessible: accessible,
      submitBehavior: submitBehavior,
      caretHidden: caretHidden,
      dataDetectorTypes: props.dataDetectorTypes,
      focusable: tabIndex !== undefined ? !tabIndex : focusable,
      mostRecentEventCount: mostRecentEventCount,
      nativeID: id != null ? id : props.nativeID,
      onBlur: _onBlur,
      onKeyPressSync: props.unstable_onKeyPressSync,
      onChange: _onChange,
      onChangeSync: useOnChangeSync === true ? _onChangeSync : null,
      onContentSizeChange: props.onContentSizeChange,
      onFocus: _onFocus,
      onScroll: _onScroll,
      onSelectionChange: _onSelectionChange,
      onSelectionChangeShouldSetResponder: emptyFunctionThatReturnsTrue,
      selection: selection,
      style: style,
      text: text
    }));
  } else if (_Platform.default.OS === 'android') {
    var _props$ariaLabelledb, _props$placeholder, _props$rows;
    var autoCapitalize = props.autoCapitalize || 'sentences';
    var _accessibilityLabelledBy = (_props$ariaLabelledb = props == null ? void 0 : props['aria-labelledby']) != null ? _props$ariaLabelledb : props == null ? void 0 : props.accessibilityLabelledBy;
    var placeholder = (_props$placeholder = props.placeholder) != null ? _props$placeholder : '';
    var children = props.children;
    var childCount = React.Children.count(children);
    (0, _invariant.default)(!(props.value != null && childCount), 'Cannot specify both value and children.');
    if (childCount > 1) {
      children = (0, _jsxRuntime.jsx)(_Text.default, {
        children: children
      });
    }
    textInput = (0, _jsxRuntime.jsx)(AndroidTextInput, Object.assign({
      ref: ref
    }, otherProps, eventHandlers, {
      accessibilityState: _accessibilityState,
      accessibilityLabelledBy: _accessibilityLabelledBy,
      accessible: accessible,
      autoCapitalize: autoCapitalize,
      submitBehavior: submitBehavior,
      caretHidden: caretHidden,
      children: children,
      disableFullscreenUI: props.disableFullscreenUI,
      focusable: tabIndex !== undefined ? !tabIndex : focusable,
      mostRecentEventCount: mostRecentEventCount,
      nativeID: id != null ? id : props.nativeID,
      numberOfLines: (_props$rows = props.rows) != null ? _props$rows : props.numberOfLines,
      onBlur: _onBlur,
      onChange: _onChange,
      onFocus: _onFocus,
      onScroll: _onScroll,
      onSelectionChange: _onSelectionChange,
      placeholder: placeholder,
      style: style,
      text: text,
      textBreakStrategy: props.textBreakStrategy
    }));
  }
  return (0, _jsxRuntime.jsx)(_TextAncestor.default.Provider, {
    value: true,
    children: textInput
  });
}
var enterKeyHintToReturnTypeMap = {
  enter: 'default',
  done: 'done',
  go: 'go',
  next: 'next',
  previous: 'previous',
  search: 'search',
  send: 'send'
};
var inputModeToKeyboardTypeMap = {
  none: 'default',
  text: 'default',
  decimal: 'decimal-pad',
  numeric: 'number-pad',
  tel: 'phone-pad',
  search: _Platform.default.OS === 'ios' ? 'web-search' : 'default',
  email: 'email-address',
  url: 'url'
};
var autoCompleteWebToAutoCompleteAndroidMap = {
  'address-line1': 'postal-address-region',
  'address-line2': 'postal-address-locality',
  bday: 'birthdate-full',
  'bday-day': 'birthdate-day',
  'bday-month': 'birthdate-month',
  'bday-year': 'birthdate-year',
  'cc-csc': 'cc-csc',
  'cc-exp': 'cc-exp',
  'cc-exp-month': 'cc-exp-month',
  'cc-exp-year': 'cc-exp-year',
  'cc-number': 'cc-number',
  country: 'postal-address-country',
  'current-password': 'password',
  email: 'email',
  'honorific-prefix': 'name-prefix',
  'honorific-suffix': 'name-suffix',
  name: 'name',
  'additional-name': 'name-middle',
  'family-name': 'name-family',
  'given-name': 'name-given',
  'new-password': 'password-new',
  off: 'off',
  'one-time-code': 'sms-otp',
  'postal-code': 'postal-code',
  sex: 'gender',
  'street-address': 'street-address',
  tel: 'tel',
  'tel-country-code': 'tel-country-code',
  'tel-national': 'tel-national',
  username: 'username'
};
var autoCompleteWebToTextContentTypeMap = {
  'address-line1': 'streetAddressLine1',
  'address-line2': 'streetAddressLine2',
  'cc-number': 'creditCardNumber',
  'current-password': 'password',
  country: 'countryName',
  email: 'emailAddress',
  name: 'name',
  'additional-name': 'middleName',
  'family-name': 'familyName',
  'given-name': 'givenName',
  nickname: 'nickname',
  'honorific-prefix': 'namePrefix',
  'honorific-suffix': 'nameSuffix',
  'new-password': 'newPassword',
  off: 'none',
  'one-time-code': 'oneTimeCode',
  organization: 'organizationName',
  'organization-title': 'jobTitle',
  'postal-code': 'postalCode',
  'street-address': 'fullStreetAddress',
  tel: 'telephoneNumber',
  url: 'URL',
  username: 'username'
};
var ExportedForwardRef = React.forwardRef(function TextInput(_ref2, forwardedRef) {
  var _autoCompleteWebToAut;
  var _ref2$allowFontScalin = _ref2.allowFontScaling,
    allowFontScaling = _ref2$allowFontScalin === void 0 ? true : _ref2$allowFontScalin,
    _ref2$rejectResponder = _ref2.rejectResponderTermination,
    rejectResponderTermination = _ref2$rejectResponder === void 0 ? true : _ref2$rejectResponder,
    _ref2$underlineColorA = _ref2.underlineColorAndroid,
    underlineColorAndroid = _ref2$underlineColorA === void 0 ? 'transparent' : _ref2$underlineColorA,
    autoComplete = _ref2.autoComplete,
    textContentType = _ref2.textContentType,
    readOnly = _ref2.readOnly,
    editable = _ref2.editable,
    enterKeyHint = _ref2.enterKeyHint,
    returnKeyType = _ref2.returnKeyType,
    inputMode = _ref2.inputMode,
    showSoftInputOnFocus = _ref2.showSoftInputOnFocus,
    keyboardType = _ref2.keyboardType,
    restProps = (0, _objectWithoutProperties2.default)(_ref2, _excluded3);
  var style = (0, _flattenStyle.default)(restProps.style);
  if ((style == null ? void 0 : style.verticalAlign) != null) {
    style.textAlignVertical = verticalAlignToTextAlignVerticalMap[style.verticalAlign];
    delete style.verticalAlign;
  }
  return (0, _jsxRuntime.jsx)(InternalTextInput, Object.assign({
    allowFontScaling: allowFontScaling,
    rejectResponderTermination: rejectResponderTermination,
    underlineColorAndroid: underlineColorAndroid,
    editable: readOnly !== undefined ? !readOnly : editable,
    returnKeyType: enterKeyHint ? enterKeyHintToReturnTypeMap[enterKeyHint] : returnKeyType,
    keyboardType: inputMode ? inputModeToKeyboardTypeMap[inputMode] : keyboardType,
    showSoftInputOnFocus: inputMode == null ? showSoftInputOnFocus : inputMode !== 'none',
    autoComplete: _Platform.default.OS === 'android' ? (_autoCompleteWebToAut = autoCompleteWebToAutoCompleteAndroidMap[autoComplete]) != null ? _autoCompleteWebToAut : autoComplete : undefined,
    textContentType: textContentType != null ? textContentType : _Platform.default.OS === 'ios' && autoComplete && autoComplete in autoCompleteWebToTextContentTypeMap ? autoCompleteWebToTextContentTypeMap[autoComplete] : textContentType
  }, restProps, {
    forwardedRef: forwardedRef,
    style: style
  }));
});
ExportedForwardRef.displayName = 'TextInput';
ExportedForwardRef.propTypes = require('deprecated-react-native-prop-types').TextInputPropTypes;
ExportedForwardRef.State = {
  currentlyFocusedInput: _TextInputState.default.currentlyFocusedInput,
  currentlyFocusedField: _TextInputState.default.currentlyFocusedField,
  focusTextInput: _TextInputState.default.focusTextInput,
  blurTextInput: _TextInputState.default.blurTextInput
};
var styles = _StyleSheet.default.create({
  multilineInput: {
    paddingTop: 5
  }
});
var verticalAlignToTextAlignVerticalMap = {
  auto: 'auto',
  top: 'top',
  bottom: 'bottom',
  middle: 'center'
};
module.exports = ExportedForwardRef;
//# sourceMappingURL=TextInput.js.map