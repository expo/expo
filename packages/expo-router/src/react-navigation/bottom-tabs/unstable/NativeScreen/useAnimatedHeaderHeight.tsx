import * as React from 'react';
import type { Animated } from 'react-native';

export const AnimatedHeaderHeightContext = React.createContext<
  Animated.AnimatedInterpolation<number> | undefined
>(undefined);

export function useAnimatedHeaderHeight() {
  const animatedValue = React.useContext(AnimatedHeaderHeightContext);

  if (animatedValue === undefined) {
    throw new Error(
      "Couldn't find the header height. Are you inside a screen in a native stack navigator?"
    );
  }

  return animatedValue;
}
