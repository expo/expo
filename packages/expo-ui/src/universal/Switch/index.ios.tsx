import { Toggle } from '@expo/ui/swift-ui';
import { disabled as disabledMod } from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import type { SwitchProps } from './types';

export function Switch({
  value,
  onValueChange,
  label,
  disabled,
  testID,
  modifiers: extraModifiers,
}: SwitchProps) {
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
