var _AndroidTextInputNativeComponent = require("../../Components/TextInput/AndroidTextInputNativeComponent");
var _RCTSingelineTextInputNativeComponent = require("../../Components/TextInput/RCTSingelineTextInputNativeComponent");
var _require = require('../../ReactNative/RendererProxy'),
  findNodeHandle = _require.findNodeHandle;
var Platform = require('../../Utilities/Platform');
var React = require('react');
var currentlyFocusedInputRef = null;
var inputs = new Set();
function currentlyFocusedInput() {
  return currentlyFocusedInputRef;
}
function currentlyFocusedField() {
  if (__DEV__) {
    console.error('currentlyFocusedField is deprecated and will be removed in a future release. Use currentlyFocusedInput');
  }
  return findNodeHandle(currentlyFocusedInputRef);
}
function focusInput(textField) {
  if (currentlyFocusedInputRef !== textField && textField != null) {
    currentlyFocusedInputRef = textField;
  }
}
function blurInput(textField) {
  if (currentlyFocusedInputRef === textField && textField != null) {
    currentlyFocusedInputRef = null;
  }
}
function focusField(textFieldID) {
  if (__DEV__) {
    console.error('focusField no longer works. Use focusInput');
  }
  return;
}
function blurField(textFieldID) {
  if (__DEV__) {
    console.error('blurField no longer works. Use blurInput');
  }
  return;
}
function focusTextInput(textField) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error('focusTextInput must be called with a host component. Passing a react tag is deprecated.');
    }
    return;
  }
  if (textField != null) {
    var _textField$currentPro;
    var fieldCanBeFocused = currentlyFocusedInputRef !== textField && ((_textField$currentPro = textField.currentProps) == null ? void 0 : _textField$currentPro.editable) !== false;
    if (!fieldCanBeFocused) {
      return;
    }
    focusInput(textField);
    if (Platform.OS === 'ios') {
      _RCTSingelineTextInputNativeComponent.Commands.focus(textField);
    } else if (Platform.OS === 'android') {
      _AndroidTextInputNativeComponent.Commands.focus(textField);
    }
  }
}
function blurTextInput(textField) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error('blurTextInput must be called with a host component. Passing a react tag is deprecated.');
    }
    return;
  }
  if (currentlyFocusedInputRef === textField && textField != null) {
    blurInput(textField);
    if (Platform.OS === 'ios') {
      _RCTSingelineTextInputNativeComponent.Commands.blur(textField);
    } else if (Platform.OS === 'android') {
      _AndroidTextInputNativeComponent.Commands.blur(textField);
    }
  }
}
function registerInput(textField) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error('registerInput must be called with a host component. Passing a react tag is deprecated.');
    }
    return;
  }
  inputs.add(textField);
}
function unregisterInput(textField) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error('unregisterInput must be called with a host component. Passing a react tag is deprecated.');
    }
    return;
  }
  inputs.delete(textField);
}
function isTextInput(textField) {
  if (typeof textField === 'number') {
    if (__DEV__) {
      console.error('isTextInput must be called with a host component. Passing a react tag is deprecated.');
    }
    return false;
  }
  return inputs.has(textField);
}
module.exports = {
  currentlyFocusedInput: currentlyFocusedInput,
  focusInput: focusInput,
  blurInput: blurInput,
  currentlyFocusedField: currentlyFocusedField,
  focusField: focusField,
  blurField: blurField,
  focusTextInput: focusTextInput,
  blurTextInput: blurTextInput,
  registerInput: registerInput,
  unregisterInput: unregisterInput,
  isTextInput: isTextInput
};