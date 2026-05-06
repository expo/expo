import { StyleSheet, Text, View } from 'react-native';
import type { CheckboxProps } from './types';

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'auto',
  },
});

/**
 * A toggle control that represents a checked or unchecked state.
 */
export function Checkbox({ value, onValueChange, label, disabled, testID }: CheckboxProps) {
  return (
    <View role="label" style={[styles.label, disabled && styles.disabled]}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onValueChange(e.target.checked)}
        disabled={disabled}
        data-testid={testID}
      />
      {label != null && <Text>{label}</Text>}
    </View>
  );
}

export * from './types';
