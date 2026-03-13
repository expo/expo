import React from 'react';
import {
  Appearance,
  StatusBar as NativeStatusBar,
  useColorScheme,
  type ColorSchemeName,
  type ColorValue,
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

// @needsAudit
/**
 * Set the background color of the status bar.
 * @param backgroundColor The background color of the status bar.
 * @param animated `true` to animate the background color change, `false` to change immediately.
 * @platform android
 * @deprecated Due to Android edge-to-edge enforcement, setting the status bar background color is deprecated and has no effect. This will be removed in a future release.
 */
export function setStatusBarBackgroundColor(backgroundColor: ColorValue, animated?: boolean) {}

// @needsAudit
/**
 * Toggle visibility of the network activity indicator.
 * @param visible If the network activity indicator should be visible.
 * @platform ios
 * @deprecated The status bar network activity indicator is not supported in iOS 13 and later. This will be removed in a future release.
 */
export function setStatusBarNetworkActivityIndicatorVisible(visible: boolean) {}

// @needsAudit
/**
 * Set the translucency of the status bar.
 * @param translucent Whether the app can draw under the status bar. When `true`, content will be
 * rendered under the status bar. This is always `true` on iOS and cannot be changed.
 * @platform android
 * @deprecated Due to Android edge-to-edge enforcement, setting the status bar as translucent is deprecated and has no effect. This will be removed in a future release.
 */
export function setStatusBarTranslucent(translucent: boolean) {}

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
