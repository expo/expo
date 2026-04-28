import {
  TextField as ComposeTextField,
  Text,
  type TextFieldKeyboardType,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import type { KeyboardTypeOptions } from 'react-native';

import type { TextInputProps } from './types';

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
  value,
  onChangeText,
  placeholder,
  autoFocus,
  editable,
  multiline,
  keyboardType,
}: TextInputProps) {
  const fallback = useNativeState<string>('');
  const state = (value ?? fallback) as typeof fallback;

  return (
    <ComposeTextField
      value={state}
      autoFocus={autoFocus}
      readOnly={editable === false}
      singleLine={!multiline}
      keyboardOptions={keyboardType ? { keyboardType: mapKeyboardType(keyboardType) } : undefined}
      onValueChange={onChangeText}>
      {placeholder ? (
        <ComposeTextField.Placeholder>
          <Text>{placeholder}</Text>
        </ComposeTextField.Placeholder>
      ) : null}
    </ComposeTextField>
  );
}

export * from './types';