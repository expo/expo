import { TextInput as RNTextInput } from 'react-native';

import { useNativeState } from '../State';
import type { TextInputProps } from './types';

export function TextInput({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  editable,
}: TextInputProps) {
  const fallback = useNativeState<string>('');
  const state = value ?? fallback;

  return (
    <RNTextInput
      value={state.value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      editable={editable}
      onChangeText={(text) => {
        state.value = text;
        onChangeText?.(text);
      }}
    />
  );
}

export * from './types';
