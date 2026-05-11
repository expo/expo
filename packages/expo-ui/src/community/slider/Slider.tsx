import * as React from 'react';
import { StyleSheet } from 'react-native';

import { type SliderProps } from './types';

/**
 * A drop-in replacement for `@react-native-community/slider`. Renders a
 * SwiftUI `Slider` on iOS, a Material 3 `Slider` on Android, and a native
 * HTML `<input type="range">` on web.
 */
export function Slider(props: SliderProps) {
  const {
    value,
    minimumValue = 0,
    maximumValue = 1,
    lowerLimit,
    upperLimit,
    step,
    disabled,
    inverted,
    minimumTrackTintColor,
    onValueChange,
    style,
  } = props;
  const clamp = (v: number) =>
    Math.min(upperLimit ?? Infinity, Math.max(lowerLimit ?? -Infinity, v));
  return (
    <input
      type="range"
      min={minimumValue}
      max={maximumValue}
      step={step && step > 0 ? step : 'any'}
      value={clamp(value ?? 0)}
      disabled={disabled}
      onChange={(e) => onValueChange?.(clamp(e.target.valueAsNumber))}
      style={{
        ...(StyleSheet.flatten(style) as React.CSSProperties),
        ...(minimumTrackTintColor !== undefined && {
          accentColor: minimumTrackTintColor as string,
        }),
        ...(inverted && { transform: 'scaleX(-1)' }),
      }}
    />
  );
}
