import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { View, TouchableOpacity } from 'react-native';

export function HeaderContainerRight(props: any) {
  return <View {...props} style={[{ paddingRight: 8, flexDirection: 'row' }, props.style]} />;
}

export default function HeaderIconButton({
  onPress,
  size = 24,
  name,
  color = 'blue',
}: {
  name: string;
  color?: string;
  size?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={{ paddingHorizontal: 12 }} onPress={onPress}>
      <Ionicons size={size} color={color} name={name} />
    </TouchableOpacity>
  );
}
