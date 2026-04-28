import { TextField, useNativeState } from '@expo/ui/swift-ui';

import type { TextInputProps } from './types';

export function TextInput({ value, onChangeText, placeholder, autoFocus }: TextInputProps) {
  const fallback = useNativeState<string>('');
  const state = (value ?? fallback) as typeof fallback;

  return (
    <TextField
      text={state}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onTextChange={onChangeText}
    />
  );
}

export * from './types';
