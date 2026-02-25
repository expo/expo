import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActionButtonProps } from './types';

const ActionButton = ({
  icon,
  title,
  description,
  onPress,
  type = 'button',
  testID,
}: ActionButtonProps) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.focused]}
      onPress={onPress}
      testID={testID}>
      <View style={styles.titleContainer}>
        {icon && <Feather name={icon} size={24} color="black" />}
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      {type === 'link' && <Feather name="chevron-right" size={24} color="black" />}
    </Pressable>
  );
};

export default ActionButton;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: 'grey',
  },
  focused: {
    opacity: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
