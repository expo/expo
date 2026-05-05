import { Switch as RNSwitch, View, Text } from 'react-native';

import type { SwitchProps } from './types';

/**
 * A toggle control that switches between on and off states.
 */
export function Switch({ value, onValueChange, label, disabled, testID }: SwitchProps) {
  if (label) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        }}>
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
