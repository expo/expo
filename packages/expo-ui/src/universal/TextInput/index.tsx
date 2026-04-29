import { useImperativeHandle, useRef } from 'react';
import { TextInput as RNTextInput } from 'react-native';

import { useNativeState } from '../State';
import type { TextInputProps } from './types';

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
  readOnly,
  inputMode,
  enterKeyHint,
  defaultValue,
  numberOfLines,
  testID,
}: TextInputProps) {
  const initialFallbackRef = useRef(defaultValue ?? '');
  const fallback = useNativeState<string>(initialFallbackRef.current);
  const state = value ?? fallback;

  const innerRef = useRef<RNTextInput>(null);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        innerRef.current?.focus();
        return Promise.resolve();
      },
      blur: () => {
        innerRef.current?.blur();
        return Promise.resolve();
      },
      clear: () => {
        state.value = '';
      },
      isFocused: () => innerRef.current?.isFocused() ?? false,
    }),
    [state]
  );

  return (
    <RNTextInput
      ref={innerRef}
      value={state.value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      editable={editable}
      readOnly={readOnly}
      multiline={multiline}
      numberOfLines={numberOfLines}
      testID={testID}
      keyboardType={keyboardType}
      inputMode={inputMode}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      returnKeyType={returnKeyType}
      enterKeyHint={enterKeyHint}
      cursorColor={typeof cursorColor === 'string' ? cursorColor : undefined}
      style={textAlign && textAlign !== 'auto' ? { textAlign } : undefined}
      onSubmitEditing={
        onSubmitEditing ? (e) => onSubmitEditing(e.nativeEvent.text) : undefined
      }
      onFocus={onFocus ? () => onFocus() : undefined}
      onBlur={onBlur ? () => onBlur() : undefined}
      onChangeText={(text) => {
        state.value = text;
        onChangeText?.(text);
      }}
    />
  );
}

export * from './types';
