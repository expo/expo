import Ionicons from '@expo/vector-icons/build/Ionicons';
import * as React from 'react';
import { PropsWithChildren } from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, View, ViewProps } from 'react-native';

const HeaderContainerRight = (props: PropsWithChildren<ViewProps>) => (
  <View {...props} style={[styles.container, props.style]} />
);

type Props = TouchableOpacityProps & {
  color?: string;
  name: string;
  size?: number;
};

const HeaderIconButton = ({ color = 'blue', disabled, name, onPress, size = 24 }: Props) => (
  <TouchableOpacity disabled={disabled} style={styles.iconButton} onPress={onPress}>
    <Ionicons size={size} color={color} name={name as any} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    paddingRight: 8,
    flexDirection: 'row',
  },
  iconButton: {
    paddingHorizontal: 12,
  },
});

export { HeaderContainerRight, HeaderIconButton };
