import { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { ActionFunction } from './index.types';
import Colors from '../../constants/Colors';

export default function ActionButton({
  name,
  action,
  onPress,
}: {
  name: string;
  action: ActionFunction;
  onPress: (action: ActionFunction) => void;
}) {
  const handlePress = useCallback(() => onPress(action), [onPress, action]);

  return (
    <View style={styles.button}>
      <TouchableOpacity onPress={handlePress}>
        <Text style={styles.buttonText}>{name}</Text>
      </TouchableOpacity>
    </View>
  );
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
