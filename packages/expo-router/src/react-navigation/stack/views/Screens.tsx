import * as React from 'react';
import { Animated, View, type ViewProps } from 'react-native';

let Screens: typeof import('react-native-screens') | undefined;

try {
  Screens = require('react-native-screens');
} catch (e) {
  // Ignore
}

export const MaybeScreenContainer = ({
  enabled,
  ...rest
}: ViewProps & {
  enabled: boolean;
  children: React.ReactNode;
}) => {
  if (Screens != null) {
    return <Screens.ScreenContainer enabled={enabled} {...rest} />;
  }

  return <View {...rest} />;
};

export const MaybeScreen = ({
  enabled,
  active,
  ...rest
}: ViewProps & {
  enabled: boolean;
  active: 0 | 1 | Animated.AnimatedInterpolation<0 | 1>;
  children: React.ReactNode;
  freezeOnBlur?: boolean;
  shouldFreeze: boolean;
  homeIndicatorHidden?: boolean;
}) => {
  if (Screens != null) {
    return (
      <Screens.Screen enabled={enabled} activityState={active} {...rest} />
    );
  }

  return <View {...rest} />;
};
