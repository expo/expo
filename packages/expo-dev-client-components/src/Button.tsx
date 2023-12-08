import { lightTheme, darkTheme, borderRadius, shadows, palette } from '@expo/styleguide-native';
import * as React from 'react';
import {
  Text as RNText,
  Animated,
  useColorScheme,
  Pressable as RNPressable,
  Easing,
} from 'react-native';

import { create } from './create-primitive';
import { rounded, margin, padding, text } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

const Text = create(RNText, {
  base: {
    fontFamily: 'Inter-Regular',
    color: lightTheme.text.default,
    fontSize: 16,
    lineHeight: 22,
  },

  props: {
    accessibilityRole: 'text',
  },

  variants: {
    ...text,

    color: {
      primary: { color: lightTheme.button.primary.foreground },
      secondary: { color: lightTheme.button.secondary.foreground },
      tertiary: { color: lightTheme.button.tertiary.foreground },
      ghost: { color: lightTheme.button.ghost.foreground },
      transparent: { color: lightTheme.button.transparent.foreground },
      default: { color: lightTheme.text.default },
    },
  },

  selectors: {
    dark: {
      base: {
        color: darkTheme.text.default,
      },

      color: {
        primary: { color: darkTheme.button.primary.foreground },
        secondary: { color: darkTheme.button.secondary.foreground },
        tertiary: { color: darkTheme.button.tertiary.foreground },
        ghost: { color: darkTheme.button.ghost.foreground },
        transparent: { color: darkTheme.button.transparent.foreground },
        default: { color: darkTheme.text.default },
      },
    },
  },
});

const Container = create(AnimatedPressable, {
  base: {
    overflow: 'hidden',
    borderRadius: borderRadius.medium,
  },

  props: {
    accessibilityRole: 'button',
    android_disableSound: true,
  },

  variants: {
    bg: {
      default: { backgroundColor: lightTheme.background.default },
      primary: { backgroundColor: lightTheme.button.primary.background },
      secondary: { backgroundColor: lightTheme.button.secondary.background },
      tertiary: { backgroundColor: lightTheme.button.tertiary.background },
      ghost: { backgroundColor: lightTheme.button.ghost.background },
      transparent: { backgroundColor: lightTheme.button.transparent.background },
      disabled: { backgroundColor: lightTheme.status.default },
    },

    border: {
      ghost: { borderColor: lightTheme.button.ghost.border, borderWidth: 1 },
    },

    shadow: {
      button: shadows.button,
    },

    flex: {
      '1': { flex: 1 },
      '0': { flex: 0 },
    },

    ...rounded,
    ...padding,
    ...margin,
  },

  selectors: {
    dark: {
      bg: {
        default: { backgroundColor: darkTheme.background.default },
        primary: { backgroundColor: darkTheme.button.primary.background },
        secondary: { backgroundColor: darkTheme.button.secondary.background },
        tertiary: { backgroundColor: darkTheme.button.tertiary.background },
        ghost: { backgroundColor: darkTheme.button.ghost.background },
        transparent: { backgroundColor: darkTheme.button.transparent.background },
        disabled: { backgroundColor: darkTheme.status.default },
      },
    },
  },
});

export const Button = {
  Container,
  FadeOnPressContainer,
  HighlightOnPressContainer,
  Text,
};

type FadingPressableProps = {
  activeOpacity?: number;
};

type NoOptionals<T> = {
  [P in keyof T]-?: T[P];
};

type ContainerProps = React.ComponentProps<typeof Container>;
type ContainerBackgroundColors = NoOptionals<ContainerProps>['bg'];

const lightHighlightColorMap: Record<ContainerBackgroundColors, string> = {
  disabled: 'transparent',
  default: lightTheme.background.secondary,
  primary: lightTheme.background.tertiary,
  secondary: lightTheme.background.quaternary,
  tertiary: palette.light.gray[600],
  ghost: lightTheme.background.tertiary,
  transparent: lightTheme.background.secondary,
};

const darkHighlightColorMap: Record<ContainerBackgroundColors, string> = {
  disabled: 'transparent',
  default: darkTheme.background.secondary,
  primary: darkTheme.background.tertiary,
  secondary: darkTheme.background.quaternary,
  tertiary: palette.dark.gray[600],
  ghost: darkTheme.background.tertiary,
  transparent: darkTheme.background.secondary,
};

const highlightColorMap = {
  dark: darkHighlightColorMap,
  light: lightHighlightColorMap,
};

function FadeOnPressContainer({
  activeOpacity = 0.2,
  ...props
}: React.ComponentProps<typeof Container> & FadingPressableProps) {
  const animatedValue = React.useRef(new Animated.Value(1));

  const onPressIn = React.useCallback(() => {
    Animated.timing(animatedValue.current, {
      toValue: activeOpacity,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressOut = React.useCallback(() => {
    Animated.timing(animatedValue.current, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Container
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...props}
      style={{
        opacity: animatedValue.current,
      }}>
      {props.children}
    </Container>
  );
}

function HighlightOnPressContainer(props: React.ComponentProps<typeof Container>) {
  const theme = useColorScheme();
  const [isPressing, setIsPressing] = React.useState(false);

  const onPressIn = React.useCallback(() => {
    setIsPressing(true);
  }, []);

  const onPressOut = React.useCallback(() => {
    setIsPressing(false);
  }, []);

  let backgroundColor = 'transparent';

  if (props.bg && isPressing && theme != null) {
    backgroundColor = highlightColorMap[theme][props.bg];
  }

  const underlayStyle = {
    backgroundColor,
  };

  return (
    <Container onPressIn={onPressIn} onPressOut={onPressOut} {...props}>
      <Animated.View style={underlayStyle}>{props.children}</Animated.View>
    </Container>
  );
}
