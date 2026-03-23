import { useTheme } from '@react-navigation/native';
import Color from 'color';
import * as React from 'react';
import {
  Animated,
  Platform,
  type StyleProp,
  StyleSheet,
  type TextProps,
  type TextStyle,
} from 'react-native';

type Props = TextProps & {
  /**
   * Whether the badge is visible
   */
  visible: boolean;
  /**
   * Content of the `Badge`.
   */
  children?: string | number;
  /**
   * Size of the `Badge`.
   */
  size?: number;
  /**
   * Style object for the tab bar container.
   */
  style?: Animated.WithAnimatedValue<StyleProp<TextStyle>>;
};

const useNativeDriver = Platform.OS !== 'web';

export function Badge({
  children,
  style,
  visible = true,
  size = 18,
  ...rest
}: Props) {
  const [opacity] = React.useState(() => new Animated.Value(visible ? 1 : 0));
  const [rendered, setRendered] = React.useState(visible);

  const { colors, fonts } = useTheme();

  React.useEffect(() => {
    if (!rendered) {
      return;
    }

    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 150,
      useNativeDriver,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setRendered(false);
      }
    });

    return () => opacity.stopAnimation();
  }, [opacity, rendered, visible]);

  if (!rendered) {
    if (visible) {
      setRendered(true);
    } else {
      return null;
    }
  }

  // @ts-expect-error: backgroundColor definitely exists
  const { backgroundColor = colors.notification, ...restStyle } =
    StyleSheet.flatten(style) || {};
  const textColor = Color(backgroundColor).isLight() ? 'black' : 'white';

  const borderRadius = size / 2;
  const fontSize = Math.floor((size * 3) / 4);

  return (
    <Animated.Text
      numberOfLines={1}
      style={[
        {
          transform: [
            {
              scale: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ],
          color: textColor,
          lineHeight: size - 1,
          height: size,
          minWidth: size,
          opacity,
          backgroundColor,
          fontSize,
          borderRadius,
          borderCurve: 'continuous',
        },
        fonts.regular,
        styles.container,
        restStyle,
      ]}
      {...rest}
    >
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    textAlign: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
});
