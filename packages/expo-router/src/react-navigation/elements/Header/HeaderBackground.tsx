import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import {
  Animated,
  Platform,
  type StyleProp,
  StyleSheet,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

type Props = Omit<ViewProps, 'style'> & {
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  children?: React.ReactNode;
};

export function HeaderBackground({ style, ...rest }: Props) {
  const { colors, dark } = useTheme();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          ...(Platform.OS === 'ios' && {
            shadowColor: dark
              ? 'rgba(255, 255, 255, 0.45)'
              : 'rgba(0, 0, 0, 1)',
          }),
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowOpacity: 0.3,
        shadowRadius: 0,
        shadowOffset: {
          width: 0,
          height: StyleSheet.hairlineWidth,
        },
      },
      default: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
    }),
  },
});
