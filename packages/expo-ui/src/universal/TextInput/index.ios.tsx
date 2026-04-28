import { TextField, useNativeState } from '@expo/ui/swift-ui';
import { disabled as disabledMod, type ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import type { TextInputProps } from './types';

export function TextInput({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  editable,
}: TextInputProps) {
  const fallback = useNativeState<string>('');
  const state = (value ?? fallback) as typeof fallback;

  const modifiers: ModifierConfig[] = [];
  if (editable === false) modifiers.push(disabledMod(true));

  return (
    <TextField
      text={state}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onTextChange={onChangeText}
      modifiers={modifiers.length > 0 ? modifiers : undefined}
    />
  );
}

export * from './types';
