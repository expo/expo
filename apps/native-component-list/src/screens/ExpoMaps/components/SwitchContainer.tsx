import React from 'react';
import { Switch, View, StyleSheet, Text } from 'react-native';

interface SwitchContainerProps {
  title: string;
  onValueChange: () => void;
  value: boolean;
  enabled?: boolean;
}

export default function SwitchContainer({
  title,
  onValueChange,
  value,
  enabled = true,
}: SwitchContainerProps) {
  return enabled ? (
    <View style={styles.switchContainer}>
      <Text>{title}</Text>
      <Switch
        value={value}
        onValueChange={() => onValueChange()}
        trackColor={{ true: 'green', false: 'red' }}
      />
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  switchContainer: {
    margin: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
