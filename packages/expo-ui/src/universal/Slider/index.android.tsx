import { Slider as ComposeSlider } from '@expo/ui/jetpack-compose';
import { testID as testIDModifier } from '@expo/ui/jetpack-compose/modifiers';

import type { SliderProps } from './types';

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step,
  disabled,
  testID,
  modifiers,
}: SliderProps) {
  // Android `steps` = number of discrete intervals between min and max.
  // Universal `step` = increment size. Convert: steps = (max - min) / step - 1.
  let steps: number | undefined;
  if (step != null && step > 0) {
    steps = Math.round((max - min) / step) - 1;
    if (steps < 0) steps = 0;
  }

  const handleValueChange = disabled
    ? undefined
    : step != null && step > 0
      ? (v: number) => onValueChange(Math.round((v - min) / step) * step + min)
      : onValueChange;

  return (
    <ComposeSlider
      value={value}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      steps={steps}
      enabled={!disabled}
      modifiers={[...(modifiers ?? []), ...(testID ? [testIDModifier(testID)] : [])]}
    />
  );
}

export * from './types';
