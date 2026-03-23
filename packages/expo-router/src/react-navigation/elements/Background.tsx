import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import {
  Animated,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

type Props = Omit<ViewProps, 'style'> & {
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  children: React.ReactNode;
};

export function Background({ style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <Animated.View
      {...rest}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    />
  );
}
