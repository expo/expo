import * as React from 'react';
import { StyleSheet } from 'react-native';

import { type SliderProps } from './types';

/**
 * A drop-in replacement for `@react-native-community/slider` on web.
 * Renders a native HTML `<input type="range">` element.
 */
export function Slider(props: SliderProps) {
  const { value, minimumValue = 0, maximumValue = 1, onValueChange, style } = props;
  return (
    <input
      type="range"
      min={minimumValue}
      max={maximumValue}
      step="any"
      value={value ?? 0}
      onChange={(e) => onValueChange?.(e.target.valueAsNumber)}
      style={StyleSheet.flatten(style) as React.CSSProperties}
    />
  );
}

Slider.displayName = 'Slider';
