import React from 'react';
import {
  Appearance,
  StatusBar as NativeStatusBar,
  useColorScheme,
  type ColorSchemeName,
} from 'react-native';

import { StatusBarProps, StatusBarStyle, StatusBarAnimation } from './types';

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
export function StatusBar({ style, hideTransitionAnimation, animated, hidden }: StatusBarProps) {
  // Pick appropriate default value depending on current theme, so if we are
  // locked to light mode we don't end up with a light status bar
  const colorScheme = useColorScheme();
  const barStyle = React.useMemo(() => styleToBarStyle(style, colorScheme), [style, colorScheme]);

  return (
    <NativeStatusBar
      animated={animated}
      hidden={hidden}
      barStyle={barStyle}
      showHideTransition={hideTransitionAnimation === 'none' ? undefined : hideTransitionAnimation}
    />
  );
}

// @needsAudit
/**
 * Set the bar style of the status bar.
 * @param style The color of the status bar text.
 * @param animated If the transition should be animated.
 */
export function setStatusBarStyle(style: StatusBarStyle, animated?: boolean) {
  NativeStatusBar.setBarStyle(styleToBarStyle(style), animated);
}

// @needsAudit
/**
 * Toggle visibility of the status bar.
 * @param hidden If the status bar should be hidden.
 * @param animation Animation to use when toggling hidden, defaults to `'none'`.
 */
export function setStatusBarHidden(hidden: boolean, animation?: StatusBarAnimation) {
  NativeStatusBar.setHidden(hidden, animation);
}

function styleToBarStyle(
  style: StatusBarStyle = 'auto',
  colorScheme: ColorSchemeName = Appearance?.getColorScheme() ?? 'light'
): 'light-content' | 'dark-content' {
  if (!colorScheme) {
    colorScheme = 'light';
  }

  let resolvedStyle = style;
  if (style === 'auto') {
    resolvedStyle = colorScheme === 'light' ? 'dark' : 'light';
  } else if (style === 'inverted') {
    resolvedStyle = colorScheme === 'light' ? 'light' : 'dark';
  }

  return resolvedStyle === 'light' ? 'light-content' : 'dark-content';
}
