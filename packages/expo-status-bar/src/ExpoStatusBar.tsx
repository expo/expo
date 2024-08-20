import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import type { StatusBarProps } from './StatusBar.types';
import styleToBarStyle from './styleToBarStyle';

/**
 * A component that allows you to configure your status bar without directly calling imperative
 * methods like `setBarStyle`.
 *
 * You will likely have multiple `StatusBar` components mounted in the same app at the same time.
 * For example, if you have multiple screens in your app, you may end up using one per screen.
 * The props of each `StatusBar` component will be merged in the order that they were mounted.
 * This component is built on top of the [StatusBar](https://reactnative.dev/docs/statusbar)
 * component exported from React Native, and it provides defaults that work better for Expo users.
 */
export default function ExpoStatusBar({
  style,
  animated,
  hidden,
  hideTransitionAnimation,
  networkActivityIndicatorVisible,
}: StatusBarProps) {
  // Pick appropriate default value depending on current theme, so if we are
  // locked to light mode we don't end up with a light status bar
  const colorScheme = useColorScheme();

  return (
    <StatusBar
      barStyle={styleToBarStyle(style, colorScheme)}
      animated={animated}
      hidden={hidden}
      networkActivityIndicatorVisible={networkActivityIndicatorVisible}
      showHideTransition={hideTransitionAnimation === 'none' ? undefined : hideTransitionAnimation}
    />
  );
}
