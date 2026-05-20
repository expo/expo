import { StyleSheet, View } from 'react-native';

import { createWebComponent } from '../web';
import type { SliderProps } from './types';

const Input = createWebComponent('input');

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
      <Input
        type="range"
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
