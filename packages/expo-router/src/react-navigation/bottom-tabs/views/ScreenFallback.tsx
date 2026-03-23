import * as React from 'react';
import {
  Animated,
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

type Props = {
  enabled: boolean;
  active: 0 | 1 | 2 | Animated.AnimatedInterpolation<0 | 1>;
  children: React.ReactNode;
  freezeOnBlur?: boolean;
  shouldFreeze: boolean;
  style?: StyleProp<ViewStyle>;
};

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
  hasTwoStates: boolean;
  children: React.ReactNode;
}) => {
  if (Screens?.screensEnabled?.()) {
    return <Screens.ScreenContainer enabled={enabled} {...rest} />;
  }

  return <View {...rest} />;
};

export function MaybeScreen({ enabled, active, ...rest }: ViewProps & Props) {
  if (Screens?.screensEnabled?.()) {
    return (
      <Screens.Screen enabled={enabled} activityState={active} {...rest} />
    );
  }

  return <View {...rest} />;
}
