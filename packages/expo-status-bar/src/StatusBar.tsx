import React from 'react';
import {
  Appearance,
  StatusBar as NativeStatusBar,
  useColorScheme,
  ColorSchemeName,
} from 'react-native';

// @docsMissing
export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';

// @docsMissing
export type StatusBarAnimation = 'none' | 'fade' | 'slide';

// @needsAudit
export type StatusBarProps = {
  /**
   * Sets the color of the status bar text. Default value is `"auto"` which
   * picks the appropriate value according to the active color scheme, eg:
   * if your app is dark mode, the style will be `"light"`.
   * @default 'auto'
   */
  style?: StatusBarStyle;

  /**
   * If the transition between status bar property changes should be
   * animated. Supported for `backgroundColor`, `barStyle` and `hidden`.
   */
  animated?: boolean;

  /**
   * If the status bar is hidden.
   */
  hidden?: boolean;

  /**
   * The transition effect when showing and hiding the status bar using
   * the hidden prop.
   * @default 'fade'
   * @platform ios
   */
  hideTransitionAnimation?: StatusBarAnimation;

  /**
   * If the network activity indicator should be visible.
   * @platform ios
   */
  networkActivityIndicatorVisible?: boolean;

  /**
   * The background color of the status bar.
   * @platform android
   */
  backgroundColor?: string;

  /**
   * If the status bar is translucent. When translucent is set to `true`,
   * the app will draw under the status bar. This is the default behaviour in
   * projects created with Expo tools because it is consistent with iOS.
   * @platform android
   */
  translucent?: boolean;
};

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
export function StatusBar({
  style,
  hideTransitionAnimation,
  translucent = true,
  backgroundColor: backgroundColorProp,
  ...props
}: StatusBarProps) {
  // Pick appropriate default value depending on current theme, so if we are
  // locked to light mode we don't end up with a light status bar
  const colorScheme = useColorScheme();
  const barStyle = React.useMemo(() => styleToBarStyle(style, colorScheme), [style, colorScheme]);

  // If translucent and no backgroundColor is provided, then use transparent
  // background
  let backgroundColor = backgroundColorProp;
  if (translucent && !backgroundColor) {
    backgroundColor = 'transparent';
  }

  return (
    <NativeStatusBar
      {...props}
      translucent={translucent}
      barStyle={barStyle}
      backgroundColor={backgroundColor}
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
export const setStatusBarHidden = NativeStatusBar.setHidden;

// @needsAudit
/**
 * Set the background color of the status bar.
 * @param backgroundColor The background color of the status bar.
 * @param animated `true` to animate the background color change, `false` to change immediately.
 * @platform android
 */
export const setStatusBarBackgroundColor = NativeStatusBar.setBackgroundColor;

// @needsAudit
/**
 * Toggle visibility of the network activity indicator.
 * @param visible If the network activity indicator should be visible.
 * @platform ios
 */
export const setStatusBarNetworkActivityIndicatorVisible =
  NativeStatusBar.setNetworkActivityIndicatorVisible;

// @needsAudit
/**
 * Set the translucency of the status bar.
 * @param translucent Whether the app can draw under the status bar. When `true`, content will be
 * rendered under the status bar. This is always `true` on iOS and cannot be changed.
 * @platform android
 */
export const setStatusBarTranslucent = NativeStatusBar.setTranslucent;

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
