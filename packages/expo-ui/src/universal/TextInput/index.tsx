import { useImperativeHandle, useRef, useState } from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';

import { useNativeState } from '../State';
import type { TextInputProps } from './types';
import { colors, durations, easings, shadows } from '../web';

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.background,
    borderColor: colors.gray[200],
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: shadows.input,
    boxSizing: 'border-box',
    color: colors.gray[900],
    display: 'flex',
    fontSize: 14,
    height: 40,
    outlineStyle: 'solid',
    outlineWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 0,
    transitionDuration: durations.fast,
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionTimingFunction: easings.standard,
  },
  focused: {
    borderColor: colors.primary[500],
    boxShadow: shadows.focus,
  },
  multiline: {
    height: 'auto',
    paddingVertical: 11,
  },
});

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
  const [focused, setFocused] = useState(false);
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
      placeholderTextColor={placeholderTextColor ?? colors.gray[500]}
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
      onSubmitEditing={onSubmitEditing ? (e) => onSubmitEditing(e.nativeEvent.text) : undefined}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
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
      style={[
        styles.input,
        focused && styles.focused,
        multiline && styles.multiline,
        style,
        textStyle,
        textAlign && textAlign !== 'auto' ? { textAlign } : null,
      ]}
    />
  );
}

export * from './types';
export { type ObservableState } from '../State';
