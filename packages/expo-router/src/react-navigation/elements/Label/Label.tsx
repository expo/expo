import {
  type ColorValue,
  type StyleProp,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { Text } from '../Text';

type Props = Omit<TextProps, 'style'> & {
  tintColor?: ColorValue;
  children?: string;
  style?: StyleProp<TextStyle>;
};

export function Label({ tintColor, style, ...rest }: Props) {
  return (
    <Text
      numberOfLines={1}
      {...rest}
      style={[styles.label, tintColor != null && { color: tintColor }, style]}
    />
  );
}

const styles = StyleSheet.create({
  label: {
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
});
