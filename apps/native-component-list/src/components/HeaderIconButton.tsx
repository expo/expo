import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

export function HeaderContainerRight(
  props: React.ComponentProps<typeof View> & {
    children?: any;
  }
) {
  return <View {...props} style={[{ paddingRight: 8, flexDirection: 'row' }, props.style]} />;
}

type Props = {
  color?: string;
  disabled?: boolean;
  name: string;
  onPress: () => void;
  size?: number;
};

export default function HeaderIconButton({
  color = 'blue',
  disabled,
  name,
  onPress,
  size = 24,
}: Props) {
  return (
    <TouchableOpacity disabled={disabled} style={{ paddingHorizontal: 12 }} onPress={onPress}>
      <Ionicons size={size} color={color} name={name} />
    </TouchableOpacity>
  );
}
