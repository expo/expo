import {
  TextField as ComposeTextField,
  Text,
  type TextFieldImeAction,
  type TextFieldKeyboardType,
  type TextFieldRef,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import {
  onSizeChanged,
  semantics,
  testID as testIDModifier,
} from '@expo/ui/jetpack-compose/modifiers';
import { useImperativeHandle, useRef } from 'react';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

import { transformToModifiers } from '../transformStyle';
import type { TextInputProps } from './types';
import { enterKeyHintToReturnKeyType, inputModeToKeyboardType, resolveEditable } from './utils';

function mapReturnKeyType(value: ReturnKeyTypeOptions): TextFieldImeAction {
  if (value === 'google' || value === 'yahoo') return 'search';
  if (value === 'join' || value === 'route' || value === 'emergency-call') return 'default';
  return value as TextFieldImeAction;
}

function mapKeyboardType(value: KeyboardTypeOptions): TextFieldKeyboardType {
  switch (value) {
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
  numberOfLines: numberOfLinesProp,
  rows,
  underlineColorAndroid,
  testID,
  placeholderTextColor,
  textStyle,
  style,
  secureTextEntry,
  autoComplete,
  onContentSizeChange,
  maxLength,
  caretHidden,
  selectionColor,
  selectionHandleColor,
  selection,
  onSelectionChange,
  selectTextOnFocus,
  modifiers: userModifiers,
}: TextInputProps) {
  const editable = resolveEditable(editableProp, readOnly);
  const numberOfLines = numberOfLinesProp ?? rows;
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
      focus: () => {
        innerRef.current?.focus();
      },
      blur: () => {
        innerRef.current?.blur();
      },
      clear: () => {
        innerRef.current?.clear();
      },
      isFocused: () => isFocusedRef.current,
      setSelection: (start: number, end: number) =>
        innerRef.current?.setSelection(start, end) ?? Promise.resolve(),
    }),
    []
  );

  const handleFocusChanged = (focused: boolean) => {
    isFocusedRef.current = focused;
    if (focused && selectTextOnFocus) {
      innerRef.current?.setSelection(0, state.value.length);
    }
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
        ...(userModifiers ?? []),
        ...transformToModifiers(style, {}),
        ...(testID ? [testIDModifier(testID)] : []),
        ...(autoComplete ? [semantics({ contentType: autoComplete })] : []),
        ...(onContentSizeChange ? [onSizeChanged(onContentSizeChange)] : []),
      ]}
      value={state}
      autoFocus={autoFocus}
      readOnly={editable === false}
      singleLine={!multiline}
      maxLines={multiline && numberOfLines && numberOfLines > 0 ? numberOfLines : undefined}
      minLines={multiline && numberOfLines && numberOfLines > 0 ? numberOfLines : undefined}
      colors={
        caretHidden || cursorColor || underlineColorAndroid || placeholderTextColor
          ? {
              ...(caretHidden
                ? { cursorColor: 'transparent' }
                : cursorColor
                  ? { cursorColor }
                  : null),
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
      textSelectionColors={
        selectionColor || selectionHandleColor
          ? {
              handleColor: selectionHandleColor ?? selectionColor,
              backgroundColor: selectionColor,
            }
          : undefined
      }
      keyboardOptions={keyboardOptions}
      keyboardActions={keyboardActions}
      onValueChange={onChangeText}
      maxLength={maxLength}
      onFocusChanged={handleFocusChanged}
      selection={selection as Parameters<typeof ComposeTextField>[0]['selection']}
      onSelectionChange={onSelectionChange}>
      {placeholder ? (
        <ComposeTextField.Placeholder>
          <Text>{placeholder}</Text>
        </ComposeTextField.Placeholder>
      ) : null}
    </ComposeTextField>
  );
}

export * from './types';
