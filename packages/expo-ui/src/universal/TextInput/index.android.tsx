import {
  TextField as ComposeTextField,
  Text,
  type TextFieldImeAction,
  type TextFieldKeyboardType,
  type TextFieldRef,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { useImperativeHandle, useRef } from 'react';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

import type { TextInputProps } from './types';

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
  editable,
  multiline,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  cursorColor,
  textAlign,
}: TextInputProps) {
  const fallback = useNativeState<string>('');
  const state = (value ?? fallback) as typeof fallback;

  const innerRef = useRef<TextFieldRef>(null);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => innerRef.current?.focus() ?? Promise.resolve(),
      blur: () => innerRef.current?.blur() ?? Promise.resolve(),
      clear: () => {
        // TODO: schedule this on UI thread via worklet
        state.value = '';
      },
    }),
    [state]
  );

  const handleFocusChanged =
    onFocus || onBlur
      ? (focused: boolean) => (focused ? onFocus?.() : onBlur?.())
      : undefined;

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
      value={state}
      autoFocus={autoFocus}
      readOnly={editable === false}
      singleLine={!multiline}
      colors={cursorColor ? { cursorColor } : undefined}
      textStyle={
        textAlign && textAlign !== 'auto' ? { textAlign } : undefined
      }
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