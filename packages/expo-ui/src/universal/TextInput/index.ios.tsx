import {
  SecureField,
  type SecureFieldRef,
  Text,
  TextField,
  type TextFieldRef,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  disabled as disabledMod,
  foregroundStyle,
  keyboardType as keyboardTypeMod,
  lineLimit,
  multilineTextAlignment,
  onGeometryChange,
  onSubmit,
  submitLabel,
  textContentType,
  textInputAutocapitalization,
  tint,
  type ModifierConfig,
} from '@expo/ui/swift-ui/modifiers';
import { useImperativeHandle, useRef } from 'react';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

import { transformToModifiers } from '../transformStyle';
import type { TextInputProps } from './types';
import {
  autoCompleteToTextContentType,
  enterKeyHintToReturnKeyType,
  inputModeToKeyboardType,
  resolveEditable,
} from './utils';

type SwiftUIKeyboardType = Parameters<typeof keyboardTypeMod>[0];
type SwiftUISubmitLabel = Parameters<typeof submitLabel>[0];

function mapReturnKeyType(value: ReturnKeyTypeOptions): SwiftUISubmitLabel {
  if (value === 'google' || value === 'yahoo') return 'search';
  if (
    value === 'default' ||
    value === 'none' ||
    value === 'previous' ||
    value === 'emergency-call'
  ) {
    return 'return';
  }
  return value as SwiftUISubmitLabel;
}

function mapKeyboardType(value: KeyboardTypeOptions): SwiftUIKeyboardType {
  if (value === 'numeric') return 'decimal-pad';
  if (value === 'number-pad') return 'numeric';
  if (value === 'visible-password') return 'default';
  return value as SwiftUIKeyboardType;
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
  numberOfLines: numberOfLinesProp,
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
  modifiers: userModifiers,
}: TextInputProps) {
  const editable = resolveEditable(editableProp, readOnly);
  const keyboardType = keyboardTypeProp ?? inputModeToKeyboardType(inputMode);
  const returnKeyType = returnKeyTypeProp ?? enterKeyHintToReturnKeyType(enterKeyHint);

  const initialFallbackRef = useRef(defaultValue ?? '');
  const fallback = useNativeState<string>(initialFallbackRef.current);
  const state = (value ?? fallback) as typeof fallback;

  const textFieldRef = useRef<TextFieldRef>(null);
  const secureFieldRef = useRef<SecureFieldRef>(null);
  const isFocusedRef = useRef(false);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        if (secureTextEntry) secureFieldRef.current?.focus();
        else textFieldRef.current?.focus();
      },
      blur: () => {
        if (secureTextEntry) secureFieldRef.current?.blur();
        else textFieldRef.current?.blur();
      },
      clear: () => {
        if (secureTextEntry) secureFieldRef.current?.clear();
        else textFieldRef.current?.clear();
      },
      isFocused: () => isFocusedRef.current,
      setSelection: (start: number, end: number) => {
        if (secureTextEntry) {
          if (__DEV__) {
            console.warn(
              "TextInput.setSelection() was ignored: SwiftUI's SecureField doesn't expose " +
                'programmatic selection. Remove `secureTextEntry` if you need to apply ' +
                'selection changes.'
            );
          }
          return Promise.resolve();
        }
        return textFieldRef.current?.setSelection(start, end) ?? Promise.resolve();
      },
    }),
    [secureTextEntry]
  );

  const handleFocusChange = (focused: boolean) => {
    isFocusedRef.current = focused;
    if (focused && selectTextOnFocus && !secureTextEntry) {
      textFieldRef.current?.setSelection(0, state.value.length);
    }
    if (focused) onFocus?.();
    else onBlur?.();
  };

  const modifiers: ModifierConfig[] = [
    ...(userModifiers ?? []),
    ...transformToModifiers(style, {}, undefined, { textStyle }),
  ];
  if (editable === false) modifiers.push(disabledMod(true));
  if (keyboardType) modifiers.push(keyboardTypeMod(mapKeyboardType(keyboardType)));
  if (autoCapitalize) {
    modifiers.push(
      textInputAutocapitalization(autoCapitalize === 'none' ? 'never' : autoCapitalize)
    );
  }
  if (autoCorrect === false) modifiers.push(autocorrectionDisabled(true));
  if (returnKeyType) modifiers.push(submitLabel(mapReturnKeyType(returnKeyType)));
  if (onSubmitEditing) {
    modifiers.push(onSubmit(() => onSubmitEditing(state.value)));
  }
  if (caretHidden) modifiers.push(tint('transparent'));
  else if (selectionColor) modifiers.push(tint(selectionColor));
  else if (cursorColor) modifiers.push(tint(cursorColor));
  if (textAlign === 'left') modifiers.push(multilineTextAlignment('leading'));
  else if (textAlign === 'right') modifiers.push(multilineTextAlignment('trailing'));
  else if (textAlign === 'center') modifiers.push(multilineTextAlignment('center'));
  const numberOfLines = numberOfLinesProp ?? rows;
  if (multiline && numberOfLines && numberOfLines > 0) {
    modifiers.push(lineLimit(numberOfLines, { reservesSpace: true }));
  }
  const mappedContentType = autoCompleteToTextContentType(autoComplete);
  if (mappedContentType) {
    modifiers.push(textContentType(mappedContentType as Parameters<typeof textContentType>[0]));
  }
  if (onContentSizeChange) modifiers.push(onGeometryChange(onContentSizeChange));

  if (secureTextEntry) {
    return (
      <SecureField
        ref={secureFieldRef}
        text={state}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onTextChange={onChangeText}
        onFocusChange={handleFocusChange}
        maxLength={maxLength}
        modifiers={modifiers.length > 0 ? modifiers : undefined}
        testID={testID}>
        {placeholderTextColor && placeholder ? (
          <SecureField.Placeholder>
            <Text modifiers={[foregroundStyle(placeholderTextColor)]}>{placeholder}</Text>
          </SecureField.Placeholder>
        ) : null}
      </SecureField>
    );
  }

  return (
    <TextField
      ref={textFieldRef}
      text={state}
      placeholder={placeholder}
      autoFocus={autoFocus}
      axis={multiline ? 'vertical' : 'horizontal'}
      onTextChange={onChangeText}
      onFocusChange={handleFocusChange}
      selection={selection as Parameters<typeof TextField>[0]['selection']}
      onSelectionChange={onSelectionChange}
      maxLength={maxLength}
      modifiers={modifiers.length > 0 ? modifiers : undefined}
      testID={testID}>
      {placeholderTextColor && placeholder ? (
        <TextField.Placeholder>
          <Text modifiers={[foregroundStyle(placeholderTextColor)]}>{placeholder}</Text>
        </TextField.Placeholder>
      ) : null}
    </TextField>
  );
}

export * from './types';
