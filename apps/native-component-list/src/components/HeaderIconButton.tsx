import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';

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
  iconButton: {
    paddingHorizontal: 12,
  },
});

export default HeaderIconButton;
