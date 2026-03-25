import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { Text } from './Text';

type Props = {
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
};

export function MissingIcon({ color, size, style }: Props) {
  return <Text style={[styles.icon, { color, fontSize: size }, style]}>⏷</Text>;
}

const styles = StyleSheet.create({
  icon: {
    backgroundColor: 'transparent',
  },
});
