import { Switch as RNSwitch, View, Text, StyleSheet } from 'react-native';

import type { SwitchProps } from './types';

const styles = StyleSheet.create({
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});

/**
 * A toggle control that switches between on and off states.
 */
export function Switch({ value, onValueChange, label, disabled = false, testID }: SwitchProps) {
  if (label) {
    return (
      <View style={[styles.view, disabled && styles.disabled]}>
        <Text>{label}</Text>
        <RNSwitch value={value} onValueChange={onValueChange} disabled={disabled} testID={testID} />
      </View>
    );
  }

  return (
    <RNSwitch value={value} onValueChange={onValueChange} disabled={disabled} testID={testID} />
  );
}

export * from './types';
