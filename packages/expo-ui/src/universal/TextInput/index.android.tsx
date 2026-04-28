import { TextField as ComposeTextField, Text, useNativeState } from '@expo/ui/jetpack-compose';

import type { TextInputProps } from './types';

export function TextInput({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  editable,
  multiline,
}: TextInputProps) {
  const fallback = useNativeState<string>('');
  const state = (value ?? fallback) as typeof fallback;

  return (
    <ComposeTextField
      value={state}
      autoFocus={autoFocus}
      readOnly={editable === false}
      singleLine={!multiline}
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
