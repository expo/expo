import { useTheme } from '@react-navigation/native';
import {
  Animated,
  Platform,
  type StyleProp,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from 'react-native';

type Props = Omit<TextProps, 'style'> & {
  tintColor?: string;
  children?: string;
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};

export function HeaderTitle({ tintColor, style, ...rest }: Props) {
  const { colors, fonts } = useTheme();

  return (
    <Animated.Text
      role="heading"
      aria-level="1"
      numberOfLines={1}
      {...rest}
      style={[
        { color: tintColor === undefined ? colors.text : tintColor },
        Platform.select({ ios: fonts.bold, default: fonts.medium }),
        styles.title,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  title: Platform.select({
    ios: {
      fontSize: 17,
    },
    android: {
      fontSize: 20,
    },
    default: {
      fontSize: 18,
    },
  }),
});
