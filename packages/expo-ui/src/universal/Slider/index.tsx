import type { ComponentProps } from 'react';
import { StyleSheet, unstable_createElement, View, type ViewProps } from 'react-native';

import type { SliderProps } from './types';

const styles = StyleSheet.create({
  view: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    cursor: 'pointer',
  },
});

const NativeSlider = (
  props: Omit<ComponentProps<'input'>, 'style' | 'type'> & { style?: ViewProps['style'] }
) => unstable_createElement('input', { ...props, type: 'range' });

/**
 * A control for selecting a value from a continuous or stepped range.
 */
export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 1,
  step,
  disabled = false,
  testID,
}: SliderProps) {
  return (
    <View style={styles.view}>
      <NativeSlider
        value={value}
        min={min}
        max={max}
        step={step ?? 'any'}
        disabled={disabled}
        onChange={(e) => onValueChange(parseFloat(e.target.value))}
        data-testid={testID}
        style={styles.input}
      />
    </View>
  );
}

export * from './types';
