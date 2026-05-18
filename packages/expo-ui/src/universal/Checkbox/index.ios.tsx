import { Toggle } from '@expo/ui/swift-ui';
import { disabled as disabledMod } from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import type { CheckboxProps } from './types';

export function Checkbox({
  value,
  onValueChange,
  label,
  disabled,
  testID,
  modifiers: extraModifiers,
}: CheckboxProps) {
  const modifiers: ModifierConfig[] = [];
  if (disabled) modifiers.push(disabledMod(true));
  if (extraModifiers) modifiers.push(...extraModifiers);

  return (
    <Toggle
      isOn={value}
      onIsOnChange={onValueChange}
      label={label}
      modifiers={modifiers}
      testID={testID}
    />
  );
}

export * from './types';
