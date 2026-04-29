import {
  TextField as ComposeTextField,
  Text,
  type TextFieldImeAction,
  type TextFieldKeyboardType,
  type TextFieldRef,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { semantics, testID as testIDModifier } from '@expo/ui/jetpack-compose/modifiers';
import { useImperativeHandle, useRef } from 'react';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

import { transformToModifiers } from '../transformStyle';
import type { TextInputProps } from './types';
import {
  enterKeyHintToReturnKeyType,
  inputModeToKeyboardType,
  resolveEditable,
} from './utils';

function mapReturnKeyType(rn: ReturnKeyTypeOptions): TextFieldImeAction {
  if (rn === 'google' || rn === 'yahoo') return 'search';
  if (rn === 'join' || rn === 'route' || rn === 'emergency-call') return 'default';
  return rn as TextFieldImeAction;
}

function mapKeyboardType(rn: KeyboardTypeOptions): TextFieldKeyboardType {
  switch (rn) {
    case 'default':
      return 'text';
    case 'email-address':
      return 'email';
    case 'numeric':
      return 'decimal';
    case 'number-pad':
      return 'number';
    case 'decimal-pad':
      return 'decimal';
    case 'phone-pad':
      return 'phone';
    case 'url':
      return 'uri';
    case 'ascii-capable':
    case 'numbers-and-punctuation':
    case 'name-phone-pad':
    case 'twitter':
    case 'web-search':
    case 'visible-password':
      return 'text';
    default:
      return 'text';
  }
}

export function TextInput({
  ref,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  editable: editableProp,
  multiline,
  keyboardType: keyboardTypeProp,
  autoCapitalize,
  autoCorrect,
  returnKeyType: returnKeyTypeProp,
  onSubmitEditing,
  onFocus,
  onBlur,
  cursorColor,
  textAlign,
  readOnly,
  inputMode,
  enterKeyHint,
  defaultValue,
  numberOfLines,
  underlineColorAndroid,
  testID,
  placeholderTextColor,
  textStyle,
  style,
  secureTextEntry,
  autoComplete,
}: TextInputProps) {
  const editable = resolveEditable(editableProp, readOnly);
  const keyboardType = keyboardTypeProp ?? inputModeToKeyboardType(inputMode);
  const returnKeyType = returnKeyTypeProp ?? enterKeyHintToReturnKeyType(enterKeyHint);

  const initialFallbackRef = useRef(defaultValue ?? '');
  const fallback = useNativeState<string>(initialFallbackRef.current);
  const state = (value ?? fallback) as typeof fallback;

  const innerRef = useRef<TextFieldRef>(null);
  const isFocusedRef = useRef(false);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => innerRef.current?.focus() ?? Promise.resolve(),
      blur: () => innerRef.current?.blur() ?? Promise.resolve(),
      clear: () => {
        // TODO: schedule this on UI thread via worklet
        state.value = '';
      },
      isFocused: () => isFocusedRef.current,
    }),
    [state]
  );

  const handleFocusChanged = (focused: boolean) => {
    isFocusedRef.current = focused;
    if (focused) onFocus?.();
    else onBlur?.();
  };

  const keyboardOptions =
    keyboardType || autoCapitalize || autoCorrect !== undefined || returnKeyType
      ? {
          ...(keyboardType ? { keyboardType: mapKeyboardType(keyboardType) } : null),
          ...(autoCapitalize ? { capitalization: autoCapitalize } : null),
          ...(autoCorrect !== undefined ? { autoCorrectEnabled: autoCorrect } : null),
          ...(returnKeyType ? { imeAction: mapReturnKeyType(returnKeyType) } : null),
        }
      : undefined;

  const keyboardActions = onSubmitEditing
    ? {
        onDone: onSubmitEditing,
        onGo: onSubmitEditing,
        onNext: onSubmitEditing,
        onSearch: onSubmitEditing,
        onSend: onSubmitEditing,
        onPrevious: onSubmitEditing,
      }
    : undefined;

  return (
    <ComposeTextField
      ref={innerRef}
      modifiers={[
        ...transformToModifiers(style, {}),
        ...(testID ? [testIDModifier(testID)] : []),
        ...(autoComplete ? [semantics({ contentType: autoComplete })] : []),
      ]}
      value={state}
      autoFocus={autoFocus}
      readOnly={editable === false}
      singleLine={!multiline}
      maxLines={multiline && numberOfLines && numberOfLines > 0 ? numberOfLines : undefined}
      minLines={multiline && numberOfLines && numberOfLines > 0 ? numberOfLines : undefined}
      colors={
        cursorColor || underlineColorAndroid || placeholderTextColor
          ? {
              ...(cursorColor ? { cursorColor } : null),
              ...(underlineColorAndroid
                ? {
                    unfocusedIndicatorColor: underlineColorAndroid,
                    focusedIndicatorColor: underlineColorAndroid,
                  }
                : null),
              ...(placeholderTextColor
                ? {
                    unfocusedPlaceholderColor: placeholderTextColor,
                    focusedPlaceholderColor: placeholderTextColor,
                    disabledPlaceholderColor: placeholderTextColor,
                  }
                : null),
            }
          : undefined
      }
      textStyle={
        textStyle || (textAlign && textAlign !== 'auto')
          ? {
              ...textStyle,
              ...(textAlign && textAlign !== 'auto' ? { textAlign } : null),
            }
          : undefined
      }
      visualTransformation={secureTextEntry ? 'password' : undefined}
      keyboardOptions={keyboardOptions}
      keyboardActions={keyboardActions}
      onValueChange={onChangeText}
      onFocusChanged={handleFocusChanged}>
      {placeholder ? (
        <ComposeTextField.Placeholder>
          <Text>{placeholder}</Text>
        </ComposeTextField.Placeholder>
      ) : null}
    </ComposeTextField>
  );
}

export * from './types';