import { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

import Colors from '../../constants/Colors';
import { ActionFunction } from './index.types';

export default function ActionButton({
  name,
  functionName,
  action,
  onPress,
}: {
  name: string;
  functionName: string;
  action: ActionFunction;
  onPress: (action: ActionFunction) => void;
}) {
  const handlePress = useCallback(() => onPress(action), [onPress, action]);

  return (
    <View style={styles.button}>
      <TouchableOpacity
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={getActionAccessibilityLabel(functionName, name)}>
        <Text style={styles.buttonText}>{name}</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Unique, emoji-free label so e2e tools can target one action among many demos,
 * e.g. `getStringAsync: RUN` or `hasXAsync: hasStringAsync`.
 */
export function getActionAccessibilityLabel(functionName: string, actionName: string) {
  return `${functionName}: ${actionName.replace(/[^\x20-\x7E]/g, '').trim()}`;
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginLeft: 5,
    backgroundColor: Colors.tintColor,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 10,
    padding: 2,
    fontWeight: '500',
    color: 'white',
  },
});
