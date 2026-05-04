import { Slider as SwiftUISlider } from '@expo/ui/swift-ui';
import { disabled as disabledMod } from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import type { SliderProps } from './types';

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step,
  disabled,
  testID,
  modifiers: extraModifiers,
}: SliderProps) {
  const modifiers: ModifierConfig[] = [];
  if (disabled) modifiers.push(disabledMod(true));
  if (extraModifiers) modifiers.push(...extraModifiers);

  return (
    <SwiftUISlider
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      modifiers={modifiers}
      testID={testID}
    />
  );
}

export * from './types';
