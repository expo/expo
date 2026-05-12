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
  rows,
  testID,
  placeholderTextColor,
  style,
  textStyle,
  secureTextEntry,
  autoComplete,
  onContentSizeChange,
  maxLength,
  caretHidden,
  selectionColor,
  selection,
  onSelectionChange,
  selectTextOnFocus,
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
      setSelection: (start: number, end: number) => {
        if (selection) selection.value = { start, end };
        return Promise.resolve();
      },
    }),
    [state, selection]
  );

  return (
    <RNTextInput
      ref={innerRef}
      value={state.value}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      autoFocus={autoFocus}
      editable={editable}
      readOnly={readOnly}
      multiline={multiline}
      numberOfLines={numberOfLines ?? rows}
      secureTextEntry={secureTextEntry}
      autoComplete={autoComplete}
      maxLength={maxLength}
      caretHidden={caretHidden}
      selectionColor={selectionColor}
      testID={testID}
      keyboardType={keyboardType}
      inputMode={inputMode}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      returnKeyType={returnKeyType}
      enterKeyHint={enterKeyHint}
      cursorColor={cursorColor}
      style={[style, textStyle, textAlign && textAlign !== 'auto' ? { textAlign } : null]}
      onSubmitEditing={onSubmitEditing ? (e) => onSubmitEditing(e.nativeEvent.text) : undefined}
      onFocus={onFocus ? () => onFocus() : undefined}
      onBlur={onBlur ? () => onBlur() : undefined}
      onChangeText={(text) => {
        state.value = text;
        onChangeText?.(text);
      }}
      onContentSizeChange={
        onContentSizeChange ? (e) => onContentSizeChange(e.nativeEvent.contentSize) : undefined
      }
      selectTextOnFocus={selectTextOnFocus}
      selection={selection?.value}
      onSelectionChange={
        onSelectionChange
          ? (e) => {
              const next = e.nativeEvent.selection;
              if (selection) selection.value = next;
              onSelectionChange(next);
            }
          : selection
            ? (e) => {
                selection.value = e.nativeEvent.selection;
              }
            : undefined
      }
    />
  );
}

export * from './types';
export { type ObservableState } from '../State';
