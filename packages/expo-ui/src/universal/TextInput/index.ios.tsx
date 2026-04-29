import { TextField, useNativeState } from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  disabled as disabledMod,
  keyboardType as keyboardTypeMod,
  onSubmit,
  submitLabel,
  textInputAutocapitalization,
  type ModifierConfig,
} from '@expo/ui/swift-ui/modifiers';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';

import type { TextInputProps } from './types';

type SwiftUIKeyboardType = Parameters<typeof keyboardTypeMod>[0];
type SwiftUISubmitLabel = Parameters<typeof submitLabel>[0];

function mapReturnKeyType(rn: ReturnKeyTypeOptions): SwiftUISubmitLabel {
  if (rn === 'google' || rn === 'yahoo') return 'search';
  if (rn === 'default' || rn === 'none' || rn === 'previous' || rn === 'emergency-call') {
    return 'return';
  }
  return rn as SwiftUISubmitLabel;
}

function mapKeyboardType(rn: KeyboardTypeOptions): SwiftUIKeyboardType {
  switch (rn) {
    case 'default':
      return 'default';
    case 'email-address':
      return 'email-address';
    case 'numeric':
      return 'decimal-pad';
    case 'number-pad':
      return 'numeric';
    case 'decimal-pad':
      return 'decimal-pad';
    case 'phone-pad':
      return 'phone-pad';
    case 'url':
      return 'url';
    case 'ascii-capable':
      return 'ascii-capable';
    case 'numbers-and-punctuation':
      return 'numbers-and-punctuation';
    case 'name-phone-pad':
      return 'name-phone-pad';
    case 'twitter':
      return 'twitter';
    case 'web-search':
      return 'web-search';
    case 'visible-password':
      return 'default';
    default:
      return 'default';
  }
}

export function TextInput({
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
}: TextInputProps) {
  const fallback = useNativeState<string>('');
  const state = (value ?? fallback) as typeof fallback;

  const handleFocusChange =
    onFocus || onBlur ? (focused: boolean) => (focused ? onFocus?.() : onBlur?.()) : undefined;

  const modifiers: ModifierConfig[] = [];
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

  return (
    <TextField
      text={state}
      placeholder={placeholder}
      autoFocus={autoFocus}
      axis={multiline ? 'vertical' : 'horizontal'}
      onTextChange={onChangeText}
      onFocusChange={handleFocusChange}
      modifiers={modifiers.length > 0 ? modifiers : undefined}
    />
  );
}

export * from './types';
